class GraphAlgorithms {
    constructor(graph, renderer) {
        this.graph = graph;
        this.renderer = renderer;
        this.delay = 1000; // Animation delay in ms
        
        // Colors for visualization
        this.colors = {
            VISITED: '#E91E63',      // Pink
            CURRENT: '#FFC107',      // Amber
            PATH: '#2196F3',         // Blue
            UNVISITED: '#4CAF50'     // Default Green
        };
        this.createAlgorithmDisplay();
    }

    // Helper method to pause execution for animations
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper to highlight a node
    async highlightNode(nodeId, color) {
        const node = this.graph.nodes.get(nodeId);
        const originalColor = node.color;
        node.color = color;
        this.renderer.draw();
        await this.sleep(this.delay);
        return originalColor;
    }

    // Helper to highlight an edge
    async highlightEdge(sourceId, targetId, color) {
        const edgeId = `${sourceId}-${targetId}`;
        const edge = this.graph.edges.get(edgeId);
        const originalColor = edge.color;
        edge.color = color;
        this.renderer.draw();
        await this.sleep(this.delay);
        return originalColor;
    }

    createAlgorithmDisplay() {
        // Create display container if it doesn't exist
        if (!document.getElementById('algorithmDisplay')) {
            const display = document.createElement('div');
            display.id = 'algorithmDisplay';
            display.className = 'algorithm-display';
            document.querySelector('.sidebar').appendChild(display);
        }
    }
    resetColors() {
        // Reset node colors
        this.graph.nodes.forEach(node => {
            node.color = CONSTANTS.NODE_COLOR;
        });

        // Reset edge colors
        this.graph.edges.forEach(edge => {
            edge.color = CONSTANTS.EDGE_COLOR;
        });

        this.renderer.draw();
    }


    // Breadth First Search
    async bfs(startNodeId) {
        this.resetColors();
        const visited = new Map(); // Store level and parent info
        const queue = [startNodeId];
        
        // Initialize start node
        visited.set(startNodeId, { level: 0, parent: null });
    
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentLevel = visited.get(currentId).level;
            
            // Update display with both visited info and current queue
            this.updateDisplay({
                visited: Object.fromEntries([...visited.entries()]),
                queue: queue.slice(), // Make a copy of current queue
                current: currentId
            }, 'bfs');
    
            // Highlight current node being processed
            const currentNode = this.graph.nodes.get(currentId);
            if (currentNode) {
                currentNode.color = this.colors.CURRENT;
                this.renderer.draw();
                await this.sleep(this.delay);
            }
    
            // Process neighbors
            for (const neighborId of this.graph.adjacencyList.get(currentId)) {
                if (!visited.has(neighborId)) {
                    visited.set(neighborId, {
                        level: currentLevel + 1,
                        parent: currentId
                    });
                    queue.push(neighborId);
    
                    // Highlight newly discovered node
                    const neighborNode = this.graph.nodes.get(neighborId);
                    if (neighborNode) {
                        neighborNode.color = this.colors.VISITED;
                    }
                    
                    // Find and highlight the correct edge
                    const edgeId1 = `${currentId}-${neighborId}`;
                    const edgeId2 = `${neighborId}-${currentId}`;
                    const edge = this.graph.edges.get(edgeId1) || this.graph.edges.get(edgeId2);
                    
                    if (edge) {
                        edge.color = this.colors.VISITED;
                    }
                    
                    this.renderer.draw();
                    await this.sleep(this.delay);
                }
            }
    
            // Set current node to visited color after processing
            if (currentNode) {
                currentNode.color = this.colors.VISITED;
                this.renderer.draw();
            }
        }
    
        // Highlight the BFS tree edges in a different color
        for (const [nodeId, info] of visited) {
            if (info.parent !== null) {
                const edgeId1 = `${info.parent}-${nodeId}`;
                const edgeId2 = `${nodeId}-${info.parent}`;
                const edge = this.graph.edges.get(edgeId1) || this.graph.edges.get(edgeId2);
                if (edge) {
                    edge.color = this.colors.PATH;
                }
            }
        }
        this.renderer.draw();
    }
    

    // Depth First Search
    async dfs(startNodeId) {
        this.resetColors();
        const visited = new Map(); // Store discovery time and parent
        let time = 0;
    
        const dfsVisit = async (nodeId, parent) => {
            time++;
            visited.set(nodeId, {
                discovery: time,
                parent: parent
            });
    
            // Update display
            this.updateDisplay(
                Object.fromEntries([...visited.entries()]),
                'dfs'
            );
    
            const currentNode = this.graph.nodes.get(nodeId);
            if (currentNode) {
                currentNode.color = this.colors.CURRENT;
                this.renderer.draw();
                await this.sleep(this.delay);
            }
    
            for (const neighborId of this.graph.adjacencyList.get(nodeId)) {
                if (!visited.has(neighborId)) {
                    const edgeId = `${nodeId}-${neighborId}`;
                    const reverseEdgeId = `${neighborId}-${nodeId}`;
                    const edge = this.graph.edges.get(edgeId) || this.graph.edges.get(reverseEdgeId);
                    
                    if (edge) {
                        edge.color = this.colors.VISITED;
                        this.renderer.draw();
                    }
                    
                    await dfsVisit(neighborId, nodeId);
                }
            }
    
            time++;
            visited.get(nodeId).finish = time;
            
            if (currentNode) {
                currentNode.color = this.colors.VISITED;
                this.renderer.draw();
            }
        };
    
        await dfsVisit(startNodeId, null);
    }

    // Dijkstra's Algorithm
    async dijkstra(startNodeId) {
        this.resetColors();
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
    
        // Initialize
        this.graph.nodes.forEach((_, nodeId) => {
            distances.set(nodeId, nodeId === startNodeId ? 0 : Infinity);
            unvisited.add(nodeId);
        });
    
        while (unvisited.size > 0) {
            // Find minimum distance node
            let currentId = null;
            let minDistance = Infinity;
            
            for (const nodeId of unvisited) {
                const distance = distances.get(nodeId);
                if (distance < minDistance) {
                    minDistance = distance;
                    currentId = nodeId;
                }
            }
    
            if (currentId === null || minDistance === Infinity) break;
    
            // Process current node
            unvisited.delete(currentId);
            const currentNode = this.graph.nodes.get(currentId);
            if (currentNode) {
                currentNode.color = this.colors.CURRENT;
                this.renderer.draw();
                await this.sleep(this.delay);
            }
            // Update display with current state
            this.updateDisplay({
                distances: Object.fromEntries([...distances]),
                previous: Object.fromEntries([...previous]),
                current: currentId,
                unvisited: Array.from(unvisited)
            }, 'dijkstra');
    
            // Process neighbors
            for (const neighborId of this.graph.adjacencyList.get(currentId)) {
                if (!unvisited.has(neighborId)) continue;
    
                const edgeId = `${currentId}-${neighborId}`;
                const reverseEdgeId = `${neighborId}-${currentId}`;
                const edge = this.graph.edges.get(edgeId) || this.graph.edges.get(reverseEdgeId);
                if (!edge) continue;
    
                const newDistance = distances.get(currentId) + edge.weight;
                if (newDistance < distances.get(neighborId)) {
                    distances.set(neighborId, newDistance);
                    previous.set(neighborId, currentId);
                    
                    // Safely color the edge and neighbor node
                    edge.color = this.colors.VISITED;
                    const neighborNode = this.graph.nodes.get(neighborId);
                    if (neighborNode) {
                        neighborNode.color = this.colors.VISITED;
                    }
                    this.renderer.draw();
                    await this.sleep(this.delay);
                }
            }
            if (currentNode) {
                currentNode.color = this.colors.VISITED;
                this.renderer.draw();
            }

        }
    
        // Highlight shortest paths
        for (const [nodeId, dist] of distances) {
            if (dist !== Infinity && nodeId !== startNodeId) {
                let current = nodeId;
                while (previous.get(current) !== undefined) {
                    const prev = previous.get(current);
                    const edgeId = `${prev}-${current}`;
                    const reverseEdgeId = `${current}-${prev}`;
                    const edge = this.graph.edges.get(edgeId) || this.graph.edges.get(reverseEdgeId);
                    if (edge) {
                        edge.color = this.colors.PATH;
                    }
                    current = prev;
                }
                this.renderer.draw();
                await this.sleep(this.delay);
            }
        }
    }

    // Prim's Algorithm for Minimum Spanning Tree
    async primMST(startNodeId) {
        this.resetColors();
        const included = new Set();
        const mstEdges = new Set();
        const costs = new Map();
        const parents = new Map();
    
        // Initialize costs
        this.graph.nodes.forEach((_, nodeId) => {
            costs.set(nodeId, nodeId === startNodeId ? 0 : Infinity);
        });
    
        while (included.size < this.graph.nodes.size) {
            // Find minimum cost node not yet included
            let minNode = null;
            let minCost = Infinity;
    
            costs.forEach((cost, nodeId) => {
                if (!included.has(nodeId) && cost < minCost) {
                    minCost = cost;
                    minNode = nodeId;
                }
            });
    
            if (minNode === null) break;
    
            included.add(minNode);
            
            // Color current node
            const currentNode = this.graph.nodes.get(minNode);
            if (currentNode) {
                currentNode.color = this.colors.CURRENT;
                this.renderer.draw();
            }
    
            // Add edge to MST if not start node
            if (parents.has(minNode)) {
                const parentId = parents.get(minNode);
                const edgeId = `${parentId}-${minNode}`;
                const reverseEdgeId = `${minNode}-${parentId}`;
                const edge = this.graph.edges.get(edgeId) || this.graph.edges.get(reverseEdgeId);
                
                if (edge) {
                    edge.color = this.colors.PATH;
                    mstEdges.add(edge);
                    this.renderer.draw();
                }
            }
    
            // Update neighbors
            for (const neighborId of this.graph.adjacencyList.get(minNode)) {
                if (included.has(neighborId)) continue;
    
                const edgeId = `${minNode}-${neighborId}`;
                const reverseEdgeId = `${neighborId}-${minNode}`;
                const edge = this.graph.edges.get(edgeId) || this.graph.edges.get(reverseEdgeId);
                
                if (!edge) continue;
    
                if (edge.weight < costs.get(neighborId)) {
                    costs.set(neighborId, edge.weight);
                    parents.set(neighborId, minNode);
                }
            }
    
            // Update display
            this.updateDisplay({
                included: Array.from(included),
                mstEdges: Array.from(mstEdges).map(e => `${e.source}-${e.target}`),
                totalCost: Array.from(mstEdges).reduce((sum, e) => sum + e.weight, 0)
            }, 'mst');
    
            await this.sleep(this.delay);
        }
    }

    updateDisplay(data, algorithm) {
        const display = document.getElementById('algorithmDisplay');
        if(!display) return;
        display.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'algorithm-table';

        switch(algorithm) {
            case 'dijkstra':
                table.innerHTML = `
                    <tr>
                        <th>Node</th>
                        <th>Distance</th>
                        <th>Previous</th>
                    </tr>
                    ${Object.keys(data.distances).map(nodeId => `
                        <tr class="${nodeId === data.current ? 'current-node' : ''}">
                            <td>${nodeId}</td>
                            <td>${data.distances[nodeId] === Infinity ? '∞' : data.distances[nodeId]}</td>
                            <td>${data.previous[nodeId] ?? '-'}</td>
                        </tr>
                    `).join('')}
                `;
                break;
            case 'bfs':
                table.innerHTML = `
                    <tr>
                        <th colspan="3">BFS Progress</th>
                    </tr>
                    <tr>
                        <th>Node</th>
                        <th>Level</th>
                        <th>Parent</th>
                    </tr>
                    ${Object.entries(data.visited).map(([node, info]) => `
                        <tr class="${node === data.current ? 'current-node' : ''}">
                            <td>${node}</td>
                            <td>${info.level}</td>
                            <td>${info.parent ?? '-'}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <th colspan="3">Current Queue</th>
                    </tr>
                    <tr>
                        <td colspan="3" class="queue-display">
                            ${data.queue.length > 0 ? 
                                data.queue.map(node => `
                                    <span class="queue-item">${node}</span>
                                `).join(' → ') 
                                : 'Empty'
                            }
                        </td>
                    </tr>
                `;
                break;

            case 'dfs':
                table.innerHTML = `
                    <tr>
                        <th>Node</th>
                        <th>Discovery</th>
                        <th>Parent</th>
                    </tr>
                    ${Object.entries(data).map(([node, info]) => `
                        <tr>
                            <td>${node}</td>
                            <td>${info.distance === Infinity ? '∞' : info.distance}</td>
                            <td>${info.parent ?? '-'}</td>
                        </tr>
                    `).join('')}
                `;
                break;

            case 'mst':
                table.innerHTML = `
                    <tr>
                        <th>MST Information</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Included Nodes</td>
                        <td>${data.included.join(', ')}</td>
                    </tr>
                    <tr>
                        <td>MST Edges</td>
                        <td>${data.mstEdges.join(', ')}</td>
                    </tr>
                    <tr>
                        <td>Total Cost</td>
                        <td>${data.totalCost}</td>
                    </tr>
                `;
                break;
        }

        display.appendChild(table);
        const colorKey = document.createElement('div');
        colorKey.className = 'color-key';
        colorKey.innerHTML = `
            <div class="color-key-title">Color Key:</div>
            <div class="color-key-item">
                <span class="color-swatch" style="background: ${this.colors.CURRENT}"></span>
                <span>Current Node</span>
            </div>
            <div class="color-key-item">
                <span class="color-swatch" style="background: ${this.colors.VISITED}"></span>
                <span>Visited Edge/Node</span>
            </div>
            <div class="color-key-item">
                <span class="color-swatch" style="background: ${this.colors.PATH}"></span>
                <span>Final Path</span>
            </div>
            <div class="color-key-item">
                <span class="color-swatch" style="background: ${this.colors.UNVISITED}"></span>
                <span>Unvisited</span>
            </div>
        `;
        display.appendChild(colorKey);
    }
}
// Simple Priority Queue implementation
class MinPriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(element, priority) {
        this.values.push({element, priority});
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return this.values.length === 0;
    }
}

// Add event listeners for algorithm buttons
document.addEventListener('DOMContentLoaded', () => {
    // ... existing event listeners ...

    document.getElementById('runAlgorithm').addEventListener('click', async () => {
        const algorithmSelect = document.getElementById('algorithm');
        const sourceNodeInput = document.getElementById('sourceNodeAlgo');
        const startNode = parseInt(sourceNodeInput.value);
        
        if (isNaN(startNode) || !graph.nodes.has(startNode)) {
            alert('Please select a valid source node!');
            return;
        }

        try {
            const algorithms = new GraphAlgorithms(graph, renderer);
            switch (algorithmSelect.value) {
                case 'bfs':
                    await algorithms.bfs(startNode);
                    break;
                case 'dfs':
                    await algorithms.dfs(startNode);
                    break;
                case 'dijkstra':
                    await algorithms.dijkstra(startNode);
                    break;
                case 'mst':
                    await algorithms.primMST(startNode);
                    break;
            }
        } catch (error) {
            alert(error.message);
        }
    });
});