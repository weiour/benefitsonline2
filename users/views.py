from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer,
    UserProfileUpdateSerializer,
    BenefitRequestSerializer,
    NotificationSerializer,
    UserRegisterSerializer,
)
from benefits.serializers import BenefitSerializer

from requests_app.models import BenefitRequest
from notifications.models import Notification
from benefits.models import Benefit


User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user, context={'request': request}).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class GosuslugiAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        mock_username = 'gosuslugi_mock'
        
        user, created = User.objects.get_or_create(
            username=mock_username,
            defaults={
                'full_name': 'Иванов Иван Иванович',
                'email': 'mock@gosuslugi.ru',
                'phone_verified': True,
                'email_verified': True,
                'category': 'pensioner',
                'region': 'all',
                'is_active': True,
            }
        )
        
        user.phone_verified = True
        user.email_verified = True
        user.is_active = True
        user.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                'user': UserSerializer(user, context={'request': request}).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    @action(detail=False, methods=['put', 'patch'])
    def profile(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def benefits(self, request):
        user = request.user
        # Получаем все активные льготы
        all_benefits = Benefit.objects.filter(active=True)
        
        # Фильтруем по целевым группам
        filtered_benefits = []
        for benefit in all_benefits:
            # Проверяем, подходит ли льгота по региону
            regions = benefit.regions if isinstance(benefit.regions, list) else []
            if 'all' in regions or user.region in regions:
                # Проверяем, подходит ли льгота по целевой группе
                target_group_keys = [tg.key for tg in benefit.target_groups.all()]
                if user.category in target_group_keys:
                    filtered_benefits.append(benefit)

        serializer = BenefitSerializer(filtered_benefits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'post'])
    def requests(self, request):
        if request.method == 'GET':
            qs = BenefitRequest.objects.filter(user=request.user).order_by('-submitted_at')
            return Response(BenefitRequestSerializer(qs, many=True).data)

        serializer = BenefitRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(BenefitRequestSerializer(obj).data, status=201)

    @action(detail=False, methods=['get'])
    def notifications(self, request):
        qs = Notification.objects.filter(user=request.user).order_by('-created_at')
        return Response(NotificationSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'])
    def mark_notification_read(self, request):
        nid = request.data.get('id')
        try:
            n = Notification.objects.get(pk=nid, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        n.is_read = True
        n.save()
        return Response({'ok': True})
