from rest_framework import serializers
from .models import Benefit, BenefitCategory, TargetGroup


class TargetGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TargetGroup
        fields = ['key', 'title']


class BenefitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BenefitCategory
        fields = ['key', 'title', 'icon']


class BenefitSerializer(serializers.ModelSerializer):
    category = BenefitCategorySerializer()
    target_groups = TargetGroupSerializer(many=True)

    class Meta:
        model = Benefit
        fields = '__all__'
