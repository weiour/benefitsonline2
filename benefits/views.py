from rest_framework import viewsets
from .models import Benefit, TargetGroup
from .serializers import BenefitSerializer, TargetGroupSerializer


class BenefitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Benefit.objects.all()
    serializer_class = BenefitSerializer


class TargetGroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TargetGroup.objects.all()
    serializer_class = TargetGroupSerializer
