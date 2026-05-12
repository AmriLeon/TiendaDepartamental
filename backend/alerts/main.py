import os
import pika
import json
import time

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")

def callback(ch, method, properties, body):
    alert = json.loads(body)
    print(f" [!] ALERTA RECIBIDA: {alert}")
    # Aquí se conectaría con el microservicio de proveedores o enviaría un correo
    # Por ahora solo simulamos la alerta crítica
    print(f" [!!!] STOCK BAJO en Variante {alert['id_variante']}, Sucursal {alert['id_sucursal']}: {alert['stock_actual']} unidades.")

def main():
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            channel = connection.channel()

            channel.queue_declare(queue='reorder_alerts')

            print(' [*] Esperando alertas de resurtido. Para salir presiona CTRL+C')

            channel.basic_consume(queue='reorder_alerts', on_message_callback=callback, auto_ack=True)

            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError:
            print("RabbitMQ not ready, retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"Error in Alerts Service: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()
