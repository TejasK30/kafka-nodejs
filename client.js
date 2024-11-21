const { Kafka } = require("kafkajs")

exports.kafka = new Kafka({
  clientId: "first-kafka-app",
  brokers: ["192.168.1.6:9092"],
})
