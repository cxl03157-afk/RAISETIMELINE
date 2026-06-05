# Stage 1: build
FROM amazoncorretto:25-al2023 AS builder
WORKDIR /app
COPY gradlew .
COPY gradle/ gradle/
RUN dnf install -y findutils && dnf clean all
RUN chmod +x gradlew && ./gradlew --version
COPY build.gradle settings.gradle ./
COPY config/ config/
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: runtime
FROM amazoncorretto:25-al2023-headless AS runtime
WORKDIR /app
RUN dnf install -y curl-minimal shadow-utils && dnf clean all
RUN useradd -u 1000 -M -s /sbin/nologin appuser
COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown appuser:appuser app.jar
USER appuser
ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
