from rest_framework import serializers
from django.contrib.auth import get_user_model
from benefits.serializers import BenefitSerializer
from requests_app.models import BenefitRequest
from notifications.models import Notification

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'full_name',
            'email',
            'category',
            'region',
            'snils',
            'phone_verified',
            'email_verified',
            'verified',
            'avatar',
        )

    def get_avatar(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            url = obj.avatar.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_verified(self, obj):
        return obj.phone_verified and obj.email_verified


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'password', 'full_name', 'email', 'category', 'region', 'snils')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'category', 'region', 'avatar', 'snils')

class BenefitRequestSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    benefit = BenefitSerializer(read_only=True)
    benefit_id = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = BenefitRequest
        fields = ('id', 'user', 'benefit', 'benefit_id', 'status', 'comment', 'submitted_at', 'updated_at')
        read_only_fields = ('id', 'user', 'status', 'submitted_at', 'updated_at')

    def create(self, validated_data):
        benefit_id = validated_data.pop('benefit_id')
        from benefits.models import Benefit
        benefit = Benefit.objects.get(pk=benefit_id)
        user = self.context['request'].user
        
        # Проверка на дубликат заявки
        if BenefitRequest.objects.filter(user=user, benefit=benefit).exists():
            raise serializers.ValidationError('Эта льгота уже добавлена в ваш список.')
        
        # Проверка лимита одобренных льгот
        approved_count = BenefitRequest.objects.filter(user=user, status='approved').count()
        max_limit = self._get_max_benefits_limit(user)
        
        if approved_count >= max_limit:
            raise serializers.ValidationError(
                f'Вы достигли максимального лимита льгот ({max_limit}). '
                'Нельзя получить больше льгот одновременно.'
            )
        
        request_obj = BenefitRequest.objects.create(user=user, benefit=benefit, **validated_data)
        return request_obj
    
    def _get_max_benefits_limit(self, user):
        """Получение максимального лимита льгот в зависимости от категории пользователя"""
        base_limit = 5
        
        if user.category == 'disabled':
            return 7
        elif user.category == 'veteran':
            return 6
        elif user.category == 'family':
            return 8
        
        return base_limit

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'is_read', 'created_at')
