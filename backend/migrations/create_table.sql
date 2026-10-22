-- Active: 1792604336043@@127.0.0.1@3306@soil_monitoring_system
-- JAGA JAGA DATABASE BELOM DI CREATE
create database if not exists soil_monitoring_system;
use soil_monitoring_system;


-- table users
create table if not exists users (
    id int primary key auto_increment,
    email varchar(255) unique not null,
    password varchar(255) not null,
    username varchar(255) not null,
    is_active boolean default true,
    role enum('admin', 'user') default 'user',
    created_at timestamp default current_timestamp
);

-- table devices
create table if not exists devices (
    id int primary key auto_increment,
    name varchar(255) not null,
    location varchar(255) not null,
    mac_address varchar(255) unique not null,
    user_id int,
    is_online tinyint(1) default 0,
    created_at timestamp default current_timestamp,
    foreign key (user_id) references users(id)
);
-- table plants berisi data tanaman (nama, location , image, created_at, humidity(nullable), temp_c(nullable), soil_condition(in %) (nullable), lux_value(nullable))
create table if not exists plants (
    id int primary key auto_increment,
    user_id int,
    device_id int,
    name varchar(255) not null,
    location varchar(255) not null,
    image varchar(255) not null,
    humidity float null,
    temp_c float null,
    soil_condition float null,
    lux_value float null,
    foreign key (user_id) references users(id),
    foreign key (device_id) references devices(id),
    created_at timestamp default current_timestamp
);



-- table  sensors untuk menyimpan data sensor yang terhubung ke device
create table if not exists sensors(
    id int primary key auto_increment,
    device_id int,
    type enum('ldr_value', 'humidity_and_temperature', 'soil_moisture', 'lux_value') not null,
    name varchar(255) not null,
    created_at timestamp default current_timestamp
);

-- table actuator untuk menyimpan data actuator yang terhubung ke device
-- cth (relay, pump)
create table if not exists actuators(
    id int primary key auto_increment,
    device_id int,
    type enum('relay', 'pump') not null,
    name varchar(255) not null,
    last_trigtered_at timestamp default current_timestamp,
    last_triggered_state enum('on', 'off') default 'off',
    created_at timestamp default current_timestamp,
    foreign key (device_id) references devices(id)
);

-- table sensor data masing2 ada karena bentuk data yang berbeda, misal temperature dan humidity itu float, soil moisture itu int
-- soil moisture data
create table if not exists soil_moisture_data(
    id int primary key auto_increment,
    sensor_id int,
    value int not null,
    created_at timestamp default current_timestamp,
    foreign key (sensor_id) references sensors(id)
);

-- table humidity and temperature data
create table if not exists humidity_and_temperature_data(
    id int primary key auto_increment,
    sensor_id int,
    temp_c float not null,
    humidity float not null,
    created_at timestamp default current_timestamp,
    foreign key (sensor_id) references sensors(id)
);

-- table lux_sensor_data
create table if not exists lux_sensor_data(
    id int primary key auto_increment,
    sensor_id int,
    value float not null,
    created_at timestamp default current_timestamp,
    foreign key (sensor_id) references sensors(id)
);