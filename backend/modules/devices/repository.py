from db import conn

def get_all_devices_with_sensors():
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT
            d.id AS device_id,
            d.name AS device_name,
            d.location AS device_location,
            d.mac_address,
            d.user_id,
            d.is_online,
            d.created_at AS device_created_at,
            s.id AS sensor_id,
            s.type AS sensor_type,
            s.name AS sensor_name,
            s.created_at AS sensor_created_at
        FROM devices AS d
        LEFT JOIN sensors AS s ON s.device_id = d.id
        ORDER BY d.id, s.id
    """

    try:
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        
def create_device(name, location, mac_address, user_id):
    cursor = conn.cursor()
    query = """
        INSERT INTO devices (name, location, mac_address, user_id)
        VALUES (%s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (name, location, mac_address, user_id))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        
# get device by id with sensors join user id get username
def get_device_by_id_with_sensors(device_id):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT
            d.id AS device_id,
            d.name AS device_name,
            d.location AS device_location,
            d.mac_address,
            d.ip_address,
            d.user_id,
            d.is_online,
            d.created_at AS device_created_at,
            s.id AS sensor_id,
            s.type AS sensor_type,
            s.name AS sensor_name,
            s.created_at AS sensor_created_at
        FROM devices AS d
        LEFT JOIN sensors AS s ON s.device_id = d.id
        WHERE d.id = %s
        ORDER BY s.id
    """

    try:
        cursor.execute(query, (device_id,))
        return cursor.fetchall()
    finally:
        cursor.close()

