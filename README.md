# Finonex

Data ETL system.

## Database

### PostgreSQL

1. Pull postgress docker: `docker pull pg`
2. Run postgress on docker container:
   `docker run -d --name postgres-container -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=db -p 5432:5432 postgres:latest`

### PgAdmin

1. Pull pgadmin docker:
   `docker pull dpage/pgadmin4`
2. Run pgadmin docker:
   `docker run -p 80:80 --name pgadmin-container -e PGADMIN_DEFAULT_EMAIL=myemail@example.com -e PGADMIN_DEFAULT_PASSWORD=mypassword -d dpage/pgadmin4`
3. After running this, the pgadmin is available on `localhost:80`.
4. To register to the created DB, the following steps should be done:
   4.1. Run `docker ps`
   4.2. Identify the posgres container id.
   4.3. Run `docker inspect {postgress-container-id}| findstr IPAddress`
   4.4. Identidy the IPAddress.
   4.5. Register to the server via PgAdmin - provide the IPAddress as the host name/address with all the credentials (username, password).

**The server will initialize the DB (establish the connection and create the ‘users_revenue’ table).**

## Server

### Prerequisites

1. Redis - the server manages a queue of events to be written to the data.json file.
2. Running redis server:

   2.1. Pull redis docker image:
   `docker pull redis`

   2.2. Run redis:
   `docker run -d --name redis-container -p 6379:6379 redis`

### Run the server:

1. `npm i`
2. `npm start`

## Data Processor

### Prerequisites

1. The DB should be ready as the data processor writes to it. For that, the server should be running (it initializes the DB). Please follow the instruction on the `Server` section.
1. Run the data processor: `node .\data_processor.js`

## Client

### Prerequisites

1. The server should be running on port 8000 in order to recieve HTTP request the client send. Please follow the instruction on the `Server` section.

### Run the Client

1. `node .\client.js`
