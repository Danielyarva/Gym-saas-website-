-- CreateIndex
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");

-- CreateIndex
CREATE INDEX "coach_clients_archived_at_idx" ON "coach_clients"("archived_at");

-- CreateIndex
CREATE INDEX "daily_checkins_date_idx" ON "daily_checkins"("date");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");

-- CreateIndex
CREATE INDEX "users_role_last_login_at_idx" ON "users"("role", "last_login_at");
