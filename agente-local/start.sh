#!/bin/bash

LOG_FILE="agente.log"

echo "🚀 Iniciando watchdog del agente..." | tee -a $LOG_FILE

while true
do
   echo "📦 $(date) - Ejecutando agente..." | tee -a $LOG_FILE

   npm run dev >> $LOG_FILE 2>&1

   EXIT_CODE=$?

   echo "❌ $(date) - Se cayó con código: $EXIT_CODE" | tee -a $LOG_FILE
   echo "🔁 Reiniciando en 5 segundos..." | tee -a $LOG_FILE

   sleep 5
done