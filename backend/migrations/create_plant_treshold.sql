create table plant_treshold(
    id int AUTO_INCREMENT PRIMARY key not null,
    plant_id int not null,
    soil_humidity float null ,
    temp_c float null,
    lux float null,
    created_at timestamp default current_timestamp
);


alter table plant_treshold
rename column soil_humidity to soil_percentage;

alter table plant_treshold
add column humidity_percentage float null;