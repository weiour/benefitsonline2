from rest_framework import serializers
from .models import Partner, PartnerOffer


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = ['id', 'name', 'logo_url', 'website', 'description', 'phone', 'address']


class PartnerOfferSerializer(serializers.ModelSerializer):
    partner = PartnerSerializer(read_only=True)
    partner_name = serializers.CharField(source='partner.name', read_only=True)
    
    class Meta:
        model = PartnerOffer
        fields = ['id', 'partner', 'partner_name', 'title', 'description', 'discount', 
                  'target_groups', 'regions', 'valid_until', 'active', 'created_at']

