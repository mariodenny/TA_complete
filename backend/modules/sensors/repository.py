from db import conn

cursor = conn.cursor()
# type sensor enum(ldr_value, humidity, temp_c, soil_condition)
def create_sensor(device_id, type, name):
    query = """
        INSERT INTO sensors (device_id, type, name)
        VALUES (%s, %s, %s)
    """
    try:
        cursor.execute(query, (device_id, type, name))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        
def get_sensor_by_device_id(device_id):
    query = "SELECT * FROM sensors WHERE device_id = %s"
    try:
        cursor.execute(query, (device_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        
