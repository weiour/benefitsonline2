from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from benefits.views import BenefitViewSet, TargetGroupViewSet
from users.views import RegisterView, UserViewSet, GosuslugiAuthView
from benefits_news.views import NewsArticleViewSet
from partners.views import PartnerViewSet, PartnerOfferViewSet

router = DefaultRouter()
router.register(r'benefits', BenefitViewSet)
router.register(r'target-groups', TargetGroupViewSet)
router.register(r'users', UserViewSet, basename='user')
router.register(r'news', NewsArticleViewSet, basename='news')
router.register(r'partners', PartnerViewSet, basename='partner')
router.register(r'partner-offers', PartnerOfferViewSet, basename='partner-offer')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/gosuslugi/', GosuslugiAuthView.as_view(), name='gosuslugi_auth'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
