# 1단계: Gradle 빌드 스테이지
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x ./gradlew

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# 2단계: 경량 런타임 스테이지 (Render / Koyeb 512MB 무료 플랜 메모리 최적화)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx384m", "-Xms128m", "-XX:+UseSerialGC", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]
