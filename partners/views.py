from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Partner, PartnerOffer
from .serializers import PartnerSerializer, PartnerOfferSerializer


class PartnerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Partner.objects.filter(active=True)
    serializer_class = PartnerSerializer


class PartnerOfferViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PartnerOffer.objects.filter(active=True)
    serializer_class = PartnerOfferSerializer

    def get_queryset(self):
        queryset = PartnerOffer.objects.filter(active=True)
        # Фильтруем только актуальные предложения (если valid_until указан, проверяем дату)
        today = timezone.now().date()
        queryset = queryset.filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=today)
        )
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        limit = int(request.query_params.get('limit', 10))
        offers = self.get_queryset()[:limit]
        serializer = self.get_serializer(offers, many=True)
        return Response(serializer.data)
