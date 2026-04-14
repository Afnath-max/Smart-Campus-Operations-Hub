FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw mvnw.cmd pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

COPY src ./src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
