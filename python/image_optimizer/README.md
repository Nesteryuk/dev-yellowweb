# image_optimizer

Пакетное сжатие изображений (JPEG / PNG / WebP) на Pillow с сохранением структуры папок.

```bash
pip install -r requirements.txt
python optimizer.py ./photos ./out --quality 80 --max-size 1920
```

- учитывает EXIF-ориентацию, RGBA/P → RGB для JPEG;
- `--quality` влияет на JPEG/WebP, PNG сжимается без потерь;
- если результат больше исходника (и без ресайза), копируется оригинал;
- битый файл не прерывает обработку, код возврата `1` при ошибках;
- нельзя указать `output` равным `source`.
