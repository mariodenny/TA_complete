from db import conn

def get_all_plants():
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT id, user_id, device_id, name, location,
               image AS image_url, humidity, temp_c, soil_condition,
               lux_value, created_at
        FROM plants
    """
    try:
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        
# function to get all user plants param user id
def get_user_plants(user_id):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT id, user_id, device_id, name, location,
               image AS image_url, humidity, temp_c, soil_condition,
               lux_value, created_at
        FROM plants
        WHERE user_id = %s
    """
    try:
        cursor.execute(query, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        
def create_plant(user_id, device_id, name, location, image_url):
    """Save the static image URL in plants.image; image bytes stay on disk."""
    cursor = conn.cursor()
    query = """
        INSERT INTO plants (user_id, device_id, name, location, image)
        VALUES (%s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (user_id, device_id, name, location, image_url))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()


def update_plant(plant_id, name=None, location=None, image_url=None):
    cursor = conn.cursor()
    query = "UPDATE plants SET "
    params = []
    updates = []

    if name is not None:
        updates.append("name = %s")
        params.append(name)
    if location is not None:
        updates.append("location = %s")
        params.append(location)
    if image_url is not None:
        updates.append("image = %s")
        params.append(image_url)

    if not updates:
        return False  # No fields to update

    query += ", ".join(updates) + " WHERE id = %s"
    params.append(plant_id)

    try:
        cursor.execute(query, tuple(params))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        
        
def delete_plant(plant_id):
    cursor = conn.cursor()
    query = "DELETE FROM plants WHERE id = %s"
    try:
        cursor.execute(query, (plant_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()

def get_plant_by_id(plant_id):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT id, user_id, device_id, name, location,
               image AS image_url, humidity, temp_c, soil_condition,
               lux_value, created_at
        FROM plants
        WHERE id = %s
    """
    try:
        cursor.execute(query, (plant_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        
def create_plant_treshold(plant_id, soil_percentage=None, humidity_percentage=None, temp_c=None, lux=None):
    cursor = conn.cursor()
    query = """
        INSERT INTO plant_treshold (plant_id, soil_percentage, humidity_percentage, temp_c, lux)
        VALUES (%s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (plant_id, soil_percentage, humidity_percentage, temp_c, lux))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        
def get_plant_treshold_by_plant_id(plant_id):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT id, plant_id, soil_percentage, humidity_percentage, temp_c, lux, created_at
        FROM plant_treshold
        WHERE plant_id = %s
    """
    try:
        cursor.execute(query, (plant_id,))
        return cursor.fetchone()
    finally:
        cursor.close()