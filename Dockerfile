# Use a Java 17 base image
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Copy the built jar file from the target directory
COPY target/*.jar app.jar

# Expose the port your app runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]