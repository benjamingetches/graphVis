// Canvas setup and drawing constants
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');


// Constants for visual elements
const CONSTANTS = {
    NODE_RADIUS: 20,
    EDGE_COLOR: '#999',
    NODE_COLOR: '#4CAF50',
    SELECTED_COLOR: '#2196F3',
    FONT: '14px Arial',
    WEIGHT_COLOR: '#666',
    WEIGHT_BACKGROUND: 'white'
};

class Graph {
    constructor() {
        // Initialize graph components
        this.nodes = new Map(); // Map of nodeId -> {x, y, label}
        this.edges = new Map(); // Map of edgeId -> {source, target, weight}
        this.adjacencyList = new Map(); // Map of nodeId -> Set of connected nodeIds
        this.nextNodeId = 0;
        const canvasRect = canvas.getBoundingClientRect();
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.radius = Math.min(canvas.width, canvas.height)/4;
    }
    findOptimalPosition() {
        if (this.nodes.size === 0) {
            return { x: this.centerX, y: this.centerY };
        }
        const padding = CONSTANTS.NODE_RADIUS * 2;
        const safeRadius = Math.min(
            this.radius,
            Math.min(
                this.centerX - padding,
                this.centerY - padding
            )
        );
        // Calculate positions in a circle
        const angleStep = (2 * Math.PI) / Math.max(6, this.nodes.size + 1);
        const positions = [];

        // Generate possible positions
        for (let i = 0; i < Math.max(6, this.nodes.size + 1); i++) {
            const angle = i * angleStep;
            positions.push({
                x: this.centerX + safeRadius * Math.cos(angle),
                y: this.centerY + safeRadius * Math.sin(angle)
            });
        }

        // Find the position furthest from all existing nodes
        let bestPosition = positions[0];
        let maxMinDistance = 0;

        positions.forEach(pos => {
            let minDistance = Infinity;
            
            // Check distance to all existing nodes
            this.nodes.forEach(node => {
                const dx = pos.x - node.x;
                const dy = pos.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                minDistance = Math.min(minDistance, distance);
            });

            if (minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestPosition = pos;
            }
        });

        return bestPosition;
    }

    // Add a node to the graph
    addNode() {
        const position = this.findOptimalPosition();
        const nodeId = this.nextNodeId++;
        
        this.nodes.set(nodeId, {
            x: position.x,
            y: position.y,
            label: nodeId.toString(),
            color: CONSTANTS.NODE_COLOR
        });
        
        this.adjacencyList.set(nodeId, new Set());
        return nodeId;
    }


    // Add an edge between two nodes
    addEdge(sourceId, targetId, weight = 1) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            throw new Error("Source or target node doesn't exist");
        }

        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;

        // Check if edge already exists and update weight if it does
        if (this.edges.has(edgeId)) {
            this.updateEdgeWeight(sourceId, targetId, weight);
            return edgeId;
        }

        this.edges.set(edgeId, {
            source: sourceId,
            target: targetId,
            weight: weight,
            color: CONSTANTS.EDGE_COLOR  // Add this line
        });

        // Update adjacency list (for undirected graph)
        this.adjacencyList.get(sourceId).add(targetId);
        this.adjacencyList.get(targetId).add(sourceId);

        return edgeId;
    }
    updateEdgeWeight(sourceId, targetId, newWeight) {
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;

        if (!this.edges.has(edgeId) && !this.edges.has(reverseEdgeId)) {
            throw new Error("Edge doesn't exist");
        }

        // Update the edge weight
        if (this.edges.has(edgeId)) {
            const edge = this.edges.get(edgeId);
            edge.weight = newWeight;
            this.edges.set(edgeId, edge);
        } else {
            const edge = this.edges.get(reverseEdgeId);
            edge.weight = newWeight;
            this.edges.set(reverseEdgeId, edge);
        }
    }

    // New method to get edge weight
    getEdgeWeight(sourceId, targetId) {
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;

        if (this.edges.has(edgeId)) {
            return this.edges.get(edgeId).weight;
        } else if (this.edges.has(reverseEdgeId)) {
            return this.edges.get(reverseEdgeId).weight;
        }
        return null; // or throw an error if you prefer
    }

    // Remove a node and all its connected edges
    removeNode(nodeId) {
        if (!this.nodes.has(nodeId)) return;

        // Remove all edges connected to this node
        this.adjacencyList.get(nodeId).forEach(targetId => {
            const edgeId1 = `${nodeId}-${targetId}`;
            const edgeId2 = `${targetId}-${nodeId}`;
            this.edges.delete(edgeId1);
            this.edges.delete(edgeId2);
            this.adjacencyList.get(targetId).delete(nodeId);
        });

        // Remove the node itself
        this.nodes.delete(nodeId);
        this.adjacencyList.delete(nodeId);
    }

    // Remove an edge between two nodes
    removeEdge(sourceId, targetId) {
        const edgeId = `${sourceId}-${targetId}`;
        if (!this.edges.has(edgeId)) return;

        this.edges.delete(edgeId);
        this.adjacencyList.get(sourceId).delete(targetId);
        this.adjacencyList.get(targetId).delete(sourceId);
    }

    // Get all neighbors of a node
    getNeighbors(nodeId) {
        return Array.from(this.adjacencyList.get(nodeId) || []);
    }

    // Get all nodes
    getNodes() {
        return Array.from(this.nodes.entries());
    }

    // Get all edges
    getEdges() {
        return Array.from(this.edges.entries());
    }

    // Clear the entire graph
    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.adjacencyList.clear();
        this.nextNodeId = 0;
    }
    arrangeNodesInCircle() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;
        const nodes = Array.from(this.nodes.entries());
        
        nodes.forEach(([nodeId, node], index) => {
            const angle = (index / nodes.length) * 2 * Math.PI;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
    }

    // Add method for grid layout
    arrangeNodesInGrid() {
        const margin = 100;
        const nodesPerRow = Math.ceil(Math.sqrt(this.nodes.size));
        const spacing = Math.min(
            (canvas.width - 2 * margin) / nodesPerRow,
            (canvas.height - 2 * margin) / nodesPerRow
        );
        
        let row = 0;
        let col = 0;
        
        this.nodes.forEach((node, nodeId) => {
            node.x = margin + col * spacing;
            node.y = margin + row * spacing;
            
            col++;
            if (col >= nodesPerRow) {
                col = 0;
                row++;
            }
        });
    }
}

// Create a global graph instance
const graph = new Graph();




class GraphRenderer {
    constructor(graph, canvas) {
        this.graph = graph;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectedNode = null;
        this.mode = 'move'; // 'move' or 'edge'
        this.edgeStart = null;
        this.edgeEnd = null;
        this.selectedEdge = null;
        
        // Bind event listeners
        this.setupEventListeners();
        
        // Handle canvas resize
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
        
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Update graph center and radius
        this.graph.centerX = this.canvas.width / 2;
        this.graph.centerY = this.canvas.height / 2;
        this.graph.radius = Math.min(this.canvas.width, this.canvas.height) / 4;
        
        this.draw(); // Redraw when resizing
    }

    // Main drawing function
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawEdges();
        this.drawNodes();
    }

    drawNodes() {
        this.graph.getNodes().forEach(([nodeId, node]) => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, CONSTANTS.NODE_RADIUS, 0, 2 * Math.PI);
            
            // Fill
            this.ctx.fillStyle = node.color || 
            (nodeId === this.selectedNode ? 
                CONSTANTS.SELECTED_COLOR : CONSTANTS.NODE_COLOR);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Label
            this.ctx.fillStyle = 'white';
            this.ctx.font = CONSTANTS.FONT;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.label, node.x, node.y);
        });
    }

    drawEdges() {
        this.graph.getEdges().forEach(([edgeId, edge]) => {
            const sourceNode = this.graph.nodes.get(edge.source);
            const targetNode = this.graph.nodes.get(edge.target);
            
            // Draw edge line
            this.ctx.beginPath();
            this.ctx.moveTo(sourceNode.x, sourceNode.y);
            this.ctx.lineTo(targetNode.x, targetNode.y);
            this.ctx.strokeStyle = edge.color || CONSTANTS.EDGE_COLOR;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw weight
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            
            // Weight background
            const weight = edge.weight.toString();
            const radius = 12;
 
            
            // Draw circle background
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.stroke();
            
            // Draw weight text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(weight, midX, midY);
        });
    }

    setupEventListeners() {
        let draggedNode = null;
        
        // Mode switching
        document.getElementById('moveMode').addEventListener('click', () => this.setMode('move'));
        document.getElementById('edgeMode').addEventListener('click', () => this.setMode('edge'));

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const pos = this.getMousePos(e);
            
            // Check for edge weight clicks first
            const edge = this.findEdgeAtPosition(pos.x, pos.y);
            if (edge !== null) {
                // Stop here and handle the edge weight click
                e.stopPropagation();  // Prevent other handlers from firing
                this.handleEdgeClick(edge, e.clientX, e.clientY);
                return;
            }
    
            // Then check for node interactions
            const node = this.findNodeAtPosition(pos.x, pos.y);
            if (node !== null) {
                if (this.mode === 'move') {
                    draggedNode = node;
                    this.selectedNode = node;
                    this.canvas.style.cursor = 'grabbing';
                } else if (this.mode === 'edge') {
                    this.edgeStart = node;
                }
                this.draw();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.getMousePos(e);
            
            if (this.mode === 'move' && draggedNode !== null) {
                const node = this.graph.nodes.get(draggedNode);
                if (node) {
                    node.x = pos.x;
                    node.y = pos.y;
                    this.draw();
                }
            } else if (this.mode === 'edge' && this.edgeStart !== null) {
                // Draw temporary edge line
                this.draw();
                this.drawTempEdge(this.edgeStart, pos);
            }

            // Update cursor
            const node = this.findNodeAtPosition(pos.x, pos.y);
            if (this.mode === 'move') {
                this.canvas.style.cursor = node !== null ? 'grab' : 'default';
            } else {
                this.canvas.style.cursor = node !== null ? 'crosshair' : 'default';
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.mode === 'edge' && this.edgeStart !== null) {
                const pos = this.getMousePos(e);
                const endNode = this.findNodeAtPosition(pos.x, pos.y);
                if (endNode !== null && endNode !== this.edgeStart) {
                    this.graph.addEdge(this.edgeStart, endNode, 1);
                }
            }
            
            draggedNode = null;
            this.edgeStart = null;
            this.draw();
        });
    }
    setMode(mode) {
        this.mode = mode;
        document.getElementById('moveMode').classList.toggle('active', mode === 'move');
        document.getElementById('edgeMode').classList.toggle('active', mode === 'edge');
    }

    handleEdgeClick(edgeId, x, y) {
        console.log('Handling edge click:', edgeId); // Debug log
        const modal = document.getElementById('weightModal');
        const input = document.getElementById('weightInput');
        const edge = this.graph.edges.get(edgeId);
        
        if (!edge) {
            console.log('Edge not found:', edgeId); // Debug log
            return;
        }
    
        // Position modal near click
        modal.style.display = 'block';
        modal.style.left = `${x + 10}px`;
        modal.style.top = `${y - 10}px`;
        
        // Set current weight
        input.value = edge.weight;
        input.focus();
        input.select();
    
        const saveWeight = () => {
            const newWeight = parseInt(input.value);
            if (!isNaN(newWeight) && newWeight > 0) {
                this.graph.updateEdgeWeight(edge.source, edge.target, newWeight);
                this.draw();
            }
            modal.style.display = 'none';
            document.removeEventListener('mousedown', closeHandler);
        };
    
        // Handle save button
        const saveButton = document.getElementById('saveWeight');
        saveButton.onclick = saveWeight;
    
        // Handle enter key
        input.onkeyup = (e) => {
            if (e.key === 'Enter') saveWeight();
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.removeEventListener('mousedown', closeHandler);
            }
        };
    
        // Close when clicking outside
        const closeHandler = (e) => {
            // Don't close if clicking the modal or its children
            if (modal.contains(e.target)) return;
            
            modal.style.display = 'none';
            document.removeEventListener('mousedown', closeHandler);
        };
    
        // Add the event listener with a slight delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('mousedown', closeHandler);
        }, 100);
    }

    drawTempEdge(startNodeId, endPos) {
        const startNode = this.graph.nodes.get(startNodeId);
        this.ctx.beginPath();
        this.ctx.moveTo(startNode.x, startNode.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.strokeStyle = CONSTANTS.EDGE_COLOR;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    findEdgeAtPosition(x, y) {
        const clickRadius = 15;  // Increased click area
        
        for (const [edgeId, edge] of this.graph.edges) {
            const sourceNode = this.graph.nodes.get(edge.source);
            const targetNode = this.graph.nodes.get(edge.target);
            
            // Calculate midpoint (where weight is displayed)
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            
            // Calculate distance from click to midpoint
            const dx = x - midX;
            const dy = y - midY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If click is within radius of weight display
            if (distance <= clickRadius) {
                console.log('Edge weight clicked:', edgeId); // Debug log
                return edgeId;
            }
        }
        return null;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    findNodeAtPosition(x, y) {
        for (const [nodeId, node] of this.graph.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            if (dx * dx + dy * dy <= CONSTANTS.NODE_RADIUS * CONSTANTS.NODE_RADIUS) {
                return nodeId;
            }
        }
        return null;
    }
}

// Initialize the renderer
const renderer = new GraphRenderer(graph, canvas);

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const addEdgeBtn = document.getElementById('addEdge');
    const sourceInput = document.getElementById('sourceNode');
    const targetInput = document.getElementById('targetNode');
    const weightInput = document.getElementById('edgeWeight');

    // Add edge button click handler
    addEdgeBtn.addEventListener('click', () => {
        const sourceId = parseInt(sourceInput.value);
        const targetId = parseInt(targetInput.value);
        const weight = parseInt(weightInput.value);

        try {
            // Validate inputs
            if (isNaN(sourceId) || isNaN(targetId) || isNaN(weight)) {
                throw new Error("Please fill in all fields with valid numbers");
            }

            if (weight < 1) {
                throw new Error("Weight must be positive");
            }

            if (!graph.nodes.has(sourceId) || !graph.nodes.has(targetId)) {
                throw new Error("Source or target node doesn't exist");
            }

            if (sourceId === targetId) {
                throw new Error("Self-loops are not allowed");
            }

            // Add the edge
            graph.addEdge(sourceId, targetId, weight);
            renderer.draw();

            // Clear inputs
            sourceInput.value = '';
            targetInput.value = '';
            weightInput.value = '1';

        } catch (error) {
            alert(error.message);
        }
    });

    // Add node button click handler
    document.getElementById('addNode').addEventListener('click', () => {

        graph.addNode();
        renderer.draw();
    });

    // Clear graph button click handler
    document.getElementById('clear').addEventListener('click', () => {
        graph.clear();
        renderer.draw();
    });
});
// Add to window for testing
window.graph = graph;
window.renderer = renderer;
window.addRandomNode = addRandomNode;