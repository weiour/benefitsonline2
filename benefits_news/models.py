from django.db import models


class NewsArticle(models.Model):
    title = models.CharField(max_length=500, verbose_name='Заголовок')
    excerpt = models.TextField(verbose_name='Краткое описание')
    content = models.TextField(verbose_name='Полный текст новости')
    source_url = models.URLField(verbose_name='Ссылка на источник')
    source_name = models.CharField(max_length=200, verbose_name='Название источника')
    category = models.CharField(max_length=100, blank=True, verbose_name='Категория')
    published_date = models.DateTimeField(verbose_name='Дата публикации')
    image_url = models.URLField(blank=True, null=True, verbose_name='URL изображения')
    active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-published_date']

    def __str__(self):
        return self.title
