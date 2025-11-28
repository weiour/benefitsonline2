from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import NewsArticle
from .serializers import NewsArticleSerializer


class NewsArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для получения новостей о льготах
    """
    queryset = NewsArticle.objects.filter(active=True).order_by('-published_date')
    serializer_class = NewsArticleSerializer

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Получить последние новости (по умолчанию 10)
        """
        limit = int(request.query_params.get('limit', 10))
        news = self.queryset[:limit]
        serializer = self.get_serializer(news, many=True)
        return Response(serializer.data)
