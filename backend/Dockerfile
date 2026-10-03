FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/MadaAcademy.Api/MadaAcademy.Api.csproj backend/MadaAcademy.Api/
RUN dotnet restore backend/MadaAcademy.Api/MadaAcademy.Api.csproj
COPY backend/MadaAcademy.Api backend/MadaAcademy.Api
RUN dotnet publish backend/MadaAcademy.Api/MadaAcademy.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    --property:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "MadaAcademy.Api.dll"]
