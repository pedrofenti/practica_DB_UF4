/*CREACION TABLA PLAYERS*/

CREATE TABLE players ( 
	id_player INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(24) NOT NULL,
	age INT NOT NULL,
	nationality CHAR(3) NOT NULL 
	);

INSERT INTO players (name, age, nationality) VALUES 
 ( "Pedro", 24, "ESP" ),
 ( "Daniel", 22, "MRC" ),
 ( "Jordi", 19, "ITA" );
