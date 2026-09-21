# Build multi-stage: compila con Maven Wrapper + JDK 21, corre con un JRE liviano.
# No requiere Maven instalado en el host que construye la imagen — usa mvnw.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -B clean package -DskipTests

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
RUN useradd --system --create-home appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
