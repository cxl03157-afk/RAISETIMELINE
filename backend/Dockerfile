# Stage 1: build
FROM amazoncorretto:25-al2023 AS builder
WORKDIR /app
COPY gradlew .
COPY gradle/ gradle/
RUN chmod +x gradlew && ./gradlew --version
COPY build.gradle settings.gradle config/ ./
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: runtime
FROM amazoncorretto:25-al2023-headless AS runtime
WORKDIR /app
RUN dnf install -y curl-minimal && dnf clean all
RUN adduser --uid 1000 --no-create-home appuser
COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown appuser:appuser app.jar
USER appuser
ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
