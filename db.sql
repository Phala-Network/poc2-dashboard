CREATE TABLE `node` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_id` int(11) NOT NULL,
  `node_name` varchar(45) CHARACTER SET utf8mb4 NOT NULL,
  `node_impl` varchar(20) DEFAULT NULL,
  `node_version` varchar(45) DEFAULT NULL,
  `city` varchar(40) CHARACTER SET utf8mb4 DEFAULT NULL,
  `peer_count` int(11) DEFAULT NULL,
  `timestamp` int(11) DEFAULT NULL,
  `online` tinyint(4) NOT NULL,
  `created_or_updated` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `node_name_UNIQUE` (`node_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6870 DEFAULT CHARSET=latin1;

CREATE TABLE `online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_name` varchar(45) CHARACTER SET utf8mb4 DEFAULT NULL,
  `online` tinyint(4) NOT NULL,
  `timestamp` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9488 DEFAULT CHARSET=latin1;

