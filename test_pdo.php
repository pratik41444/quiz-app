<?php
require_once 'php/config.php';


if ($pdo) {
    echo "PDO connection success!";
} else {
    echo "PDO connection failed!";
}
