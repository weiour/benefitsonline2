#!/usr/bin/env python
"""
Простой скрипт для автоматического сбора новостей
Запускает команду fetch_news каждые 6 часов
"""
import time
import subprocess
import sys
import os

# Устанавливаем рабочую директорию
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("Запуск автоматического сборщика новостей...")
    print("Новости будут собираться каждые 6 часов")
    print("Нажмите Ctrl+C для остановки\n")
    
    while True:
        try:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Запуск сбора новостей...")
            
            # Запускаем команду
            result = subprocess.run(
                [sys.executable, 'manage.py', 'fetch_news', '--limit', '10'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Сбор новостей завершен успешно")
            else:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Ошибка при сборе новостей:")
                print(result.stderr)
            
            # Ждем 6 часов (21600 секунд)
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Следующий запуск через 6 часов...\n")
            time.sleep(21600)  # 6 часов
            
        except KeyboardInterrupt:
            print("\nОстановка сборщика новостей...")
            break
        except Exception as e:
            print(f"Ошибка: {e}")
            print("Повторная попытка через 1 час...")
            time.sleep(3600)  # 1 час при ошибке

if __name__ == '__main__':
    main()

