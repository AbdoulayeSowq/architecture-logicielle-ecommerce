#!/usr/bin/env bash
# ============================================================
# LMS EPT — Migration lmsdb → 5 bases de données séparées
# Usage: bash migrate_databases.sh
# ============================================================
set -e

DB_USER="macbookpro"
SOURCE_DB="lmsdb"

echo "🚀 Démarrage de la migration des données..."
echo "Source : $SOURCE_DB → user_db, course_db, university_db, announcement_db, ai_db"
echo ""

# ── Fonction : exporter des tables et importer dans une cible ──
migrate_tables() {
  local target_db="$1"
  shift
  local tables=("$@")
  local table_args=""
  for t in "${tables[@]}"; do
    table_args="$table_args -t $t"
  done

  echo "📦 Migration → $target_db (${#tables[@]} tables)..."
  pg_dump -U "$DB_USER" -d "$SOURCE_DB" \
    $table_args \
    --data-only \
    --disable-triggers \
    --column-inserts \
    2>/dev/null | psql -U "$DB_USER" -d "$target_db" -q 2>/dev/null
  echo "   ✅ $target_db OK"
}

# ── user_db ──────────────────────────────────────────────────
migrate_tables "user_db" \
  adaptive_profiles \
  address \
  app_users \
  badges \
  gamification_profiles \
  gamification_skills \
  lecturers \
  mentorships \
  profil_competences \
  recommandations \
  recommendations \
  students \
  user_badges

# ── course_db ─────────────────────────────────────────────────
migrate_tables "course_db" \
  teaching_units \
  modules \
  courses \
  materials \
  quizzes \
  questions \
  question_options \
  quiz_results \
  student_answers \
  integrity_reports \
  integrity_report_suspicious_video_segments \
  grades \
  forum_threads \
  forum_posts \
  forum_thread_views \
  forum_upvotes \
  lacunes \
  certificats \
  interactions_chatbot \
  assignments \
  submissions \
  attendance \
  evaluations \
  student_enrollments \
  enrollment_absences \
  enrollment_skills \
  department_courses \
  department_course_ids

# ── university_db ─────────────────────────────────────────────
migrate_tables "university_db" \
  establishments \
  faculties \
  cycles \
  departments \
  classes \
  genies

# ── announcement_db ───────────────────────────────────────────
migrate_tables "announcement_db" \
  announcements \
  messages \
  notifications

# ── ai_db ─────────────────────────────────────────────────────
migrate_tables "ai_db" \
  vector_store

echo ""
echo "✅ Migration terminée ! Vérification des counts..."
echo ""

# ── Vérification : comparer les counts source vs cible ────────
verify_count() {
  local table="$1"
  local src_db="$2"
  local tgt_db="$3"
  local src=$(psql -U "$DB_USER" -d "$src_db" -tAc "SELECT COUNT(*) FROM $table 2>/dev/null" 2>/dev/null || echo "N/A")
  local tgt=$(psql -U "$DB_USER" -d "$tgt_db" -tAc "SELECT COUNT(*) FROM $table 2>/dev/null" 2>/dev/null || echo "N/A")
  if [ "$src" = "$tgt" ]; then
    echo "   ✅ $table : $src rows"
  else
    echo "   ❌ $table : source=$src tgt=$tgt MISMATCH!"
  fi
}

echo "📊 user_db :"
for t in adaptive_profiles app_users students lecturers recommendations; do
  verify_count "$t" "$SOURCE_DB" "user_db"
done

echo "📊 course_db :"
for t in modules teaching_units courses materials quizzes questions question_options quiz_results student_answers integrity_reports lacunes; do
  verify_count "$t" "$SOURCE_DB" "course_db"
done

echo "📊 university_db :"
for t in establishments cycles departments classes; do
  verify_count "$t" "$SOURCE_DB" "university_db"
done

echo "📊 announcement_db :"
for t in notifications messages announcements; do
  verify_count "$t" "$SOURCE_DB" "announcement_db"
done

echo "📊 ai_db :"
verify_count "vector_store" "$SOURCE_DB" "ai_db"

echo ""
echo "🎉 Migration complète !"
