FROM openjdk:17-slim

WORKDIR /app


COPY target/code-reviewer-*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
