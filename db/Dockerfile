FROM debian:bookworm-slim
COPY --from=surrealdb/surrealdb:v3 /surreal /surreal
COPY migrate.sh /migrate.sh
COPY migrations/ /migrations/
EXPOSE 8080
CMD ["/surreal", "start", "--bind", "0.0.0.0:8080", "surrealkv://data/srdb.db"]
