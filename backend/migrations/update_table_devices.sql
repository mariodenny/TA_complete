-- Active: 1792523569288@@127.0.0.1@3306@soil_monitoring_system
-- tambah col ip address untuk devices biar ada 
-- di dashboard / profile
alter Table devices
add column ip_address varchar(45) null;



-- insert dummy users
insert into users (email, password, username, role) values
('admin@example.com', '$2a$12$TmSh6TilT7Exd62/R4Nf9O29HaUhHNhJ0Dwo/VxdhPwlHQ6/Wwqfu', 'admin', 'admin');
