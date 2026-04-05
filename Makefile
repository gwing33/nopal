.PHONY: dev seed down reset clean

DB_USER ?= root
DB_PASS ?= root

# ── Full-stack dev lifecycle ───────────────────────────────────────────────────

## Start the database and webapp together, then seed the database.
dev:
	docker compose up -d --wait
	$(MAKE) seed
	@echo ""
	@echo "  ✓ SurrealDB  →  http://localhost:8080"
	@echo "  ✓ Webapp     →  http://localhost:3000"
	@echo "  ✓ Logs       →  http://localhost:9999"
	@echo ""
	@echo "  DB users:"
	@echo "    root   user: $$DB_USER        pass: $$DB_PASS"
	@echo "    admin  user: admin            pass: adminpassword  (NS nopal)"
	@echo "    app    user: app              pass: apppassword    (DB nopal/dev)"
	@echo ""

## Seed the running database with default namespaces, databases, and users.
seed:
	cat db/seed.surql | docker compose exec -T db /surreal sql \
		--endpoint http://localhost:8080 \
		--user $(DB_USER) \
		--pass $(DB_PASS) \
		--pretty
	cd webapp && npm run seed:data

## Stop all containers (data is preserved in named volumes).
down:
	docker compose down

## Destroy all data and start fresh.
reset: clean dev

## Stop all containers and delete all named volumes — all data will be lost.
clean:
	docker compose down -v
