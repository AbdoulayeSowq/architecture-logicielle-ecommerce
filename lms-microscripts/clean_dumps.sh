#!/bin/bash
# Script pour nettoyer les dumps SQL des donnees de test

DB_DIR="./db-dumps"

echo "Nettoyage des dumps SQL..."

# Nettoyer course_db.sql - supprimer les lignes avec example.com et demo
sed -i.bak '/example\.com/d' "$DB_DIR/course_db.sql"
sed -i.bak '/youtube\.com\/watch?v=demo/d' "$DB_DIR/course_db.sql"

# Nettoyer university_db.sql - supprimer les lignes avec Test/test
sed -i.bak '/Test\t/d' "$DB_DIR/university_db.sql"
sed -i.bak '/test\t/d' "$DB_DIR/university_db.sql"

# Nettoyer announcement_db.sql - supprimer les lignes avec test
sed -i.bak '/test\t/d' "$DB_DIR/announcement_db.sql"

echo "Nettoyage termine. Les fichiers .bak sont des sauvegardes originales."
echo "Fichiers modifies:"
echo "  - course_db.sql"
echo "  - university_db.sql"
echo "  - announcement_db.sql"
