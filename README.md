# KafkaJS with Docker

This repository demonstrates using **KafkaJS** with **Apache Kafka** running in Docker containers. The setup includes Kafka producers and consumers interacting with a Kafka broker.

## Prerequisites

Ensure the following tools are installed:

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/)

## Getting Started

### 1. Start Zookeeper Container

Start the Zookeeper container and expose port `2181`:

```bash
docker run -p 2181:2181 zookeeper
```

### 2. Start Kafka Container

Run the Kafka container and configure it to connect to Zookeeper. Replace `<PRIVATE_IP>` with your system's private IP address.

```bash
docker run -p 9092:9092 \
-e KAFKA_ZOOKEEPER_CONNECT=<PRIVATE_IP>:2181 \
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<PRIVATE_IP>:9092 \
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
confluentinc/cp-kafka
```

### 3. Install Dependencies

Initialize a Node.js project and install KafkaJS:

```bash
yarn init
yarn add kafkajs
```

### 4. Create a KafkaJS Client

Create a `client.js` file to set up the Kafka connection:

```javascript
const { Kafka } = require("kafkajs");

exports.kafka = new Kafka({
  clientId: "first-kafka-app",
  brokers: ["IP_ADDRESS:9092"], // Replace with your Kafka broker address
});
```

### 5. Create a Producer

Create a `producer.js` file:

```javascript
const { kafka } = require("./client");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function init() {
  const producer = kafka.producer();

  console.log("Connecting Producer...");
  await producer.connect();
  console.log("Producer Connected Successfully");

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (line) => {
    const [riderName, location] = line.split(" ");

    await producer.send({
      topic: "rider-updates",
      messages: [
        {
          partition: location.toLowerCase() === "north" ? 0 : 1,
          key: "location-update",
          value: JSON.stringify({ name: riderName, location }),
        },
      ],
    });

    rl.prompt();
  }).on("close", async () => {
    await producer.disconnect();
    console.log("Producer Disconnected");
    process.exit(0);
  });
}

init();
```

### 6. Create a Consumer

Create a `consumer.js` file:

```javascript
const { kafka } = require("./client");
const group = process.argv[2];

async function init() {
  const consumer = kafka.consumer({ groupId: group });

  console.log(`Connecting Consumer (${group})...`);
  await consumer.connect();
  console.log(`Consumer (${group}) Connected`);

  await consumer.subscribe({ topics: ["rider-updates"], fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        `${group}: [${topic}]: PART:${partition}:`,
        message.value.toString()
      );
    },
  });
}

init();
```

### 7. Running the Application

#### Start the Kafka Producer

Run the producer script:

```bash
node producer.js
```

Type messages in the format `<riderName> <location>` to send them to the Kafka topic `rider-updates`.

#### Start the Kafka Consumer

Run the consumer script with a group ID:

```bash
node consumer.js group1
```

The consumer will listen to messages from the `rider-updates` topic and log them to the console.

## Example

1. **Producer Input:**
   ```text
   Alice North
   Bob South
   ```

## Key Commands

- **Start Zookeeper:**

  ```bash
  docker run -p 2181:2181 zookeeper
  ```

- **Start Kafka:**

  ```bash
  docker run -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=<PRIVATE_IP>:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<PRIVATE_IP>:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka
  ```

- **Run Producer:**

  ```bash
  node producer.js
  ```

- **Run Consumer:**
  ```bash
  node consumer.js <groupId>
  ```
