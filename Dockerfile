FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip uninstall flask werkzeug -y
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python", "app.py"]