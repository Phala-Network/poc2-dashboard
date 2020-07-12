CREATE TABLE `node` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_id` int(11) NOT NULL,
  `node_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
  `node_impl` varchar(20) DEFAULT NULL,
  `node_version` varchar(45) DEFAULT NULL,
  `city` varchar(40) CHARACTER SET utf8mb4 DEFAULT NULL,
  `peer_count` int(11) DEFAULT '0',
  `timestamp` int(11) NOT NULL,
  `online` tinyint(4) NOT NULL,
  `created_or_updated` int(11) NOT NULL,
  `node_eras` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `node_name_UNIQUE` (`node_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10227 DEFAULT CHARSET=latin1;

CREATE TABLE `online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
  `online` tinyint(4) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `connect_at` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13253 DEFAULT CHARSET=latin1;

CREATE TABLE `gatekeeper` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `controller` varchar(64) NOT NULL,
  `stash` varchar(64) NOT NULL DEFAULT '',
  `is_gatekeeper` tinyint(4) NOT NULL DEFAULT '0',
  `is_tee` tinyint(4) NOT NULL DEFAULT '0',
  `tee_score` int(11) NOT NULL DEFAULT '0',
  `gatekeeper_eras` int(11) NOT NULL DEFAULT '0',
  `node_name` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

CREATE TABLE `gatekeeper_era_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `era` int(11) NOT NULL,
  `controller` varchar(64) NOT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
