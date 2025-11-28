<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto p-3">
        <div class="flex align-items-center">
          <Button 
            icon="pi pi-arrow-left" 
            @click="$router.back()"
            class="p-button-text p-button-plain"
          />
          <h1 class="text-2xl font-bold m-0 text-primary">Мой профиль</h1>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="container mx-auto p-4">
        <div v-if="loading" class="flex justify-content-center">
          <ProgressSpinner />
        </div>

        <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
          {{ error }}
          <Button 
            @click="loadProfileData" 
            label="Попробовать снова" 
            class="p-button-outlined p-button-sm ml-3" 
          />
        </Message>

        <div v-else>
          <Card class="shadow-2 border-round-2xl mb-3">
            <template #content>
              <div class="flex justify-content-center align-items-center gap-3 pt-0 pb-2">
                <Avatar 
                  :image="user.avatar || undefined"
                  :label="user.avatar ? undefined : getUserInitials()" 
                  size="xlarge"
                  class="flex-shrink-0"
                />
                <div class="flex flex-column justify-content-center flex-1 gap-1">
                  <h2 class="text-xl font-bold m-0">{{ user.full_name || 'Пользователь' }}</h2>
                  <p class="text-color-secondary m-0 mb-1">{{ getUserCategory() }}</p>
                </div>
              </div>
              <Chip 
                    :label="getRegionLabel(user.region)" 
                    icon="pi pi-map-marker"
                    class="text-xs w-full flex justify-content-center mb-3"
              />

              <Button 
                icon="pi pi-pencil" 
                @click="openEditModal"
                class="p-button-outlined w-full h-3rem gap-3 align-items-center justify-content-center p-0 p-button p-button-primary"
              >
                <i class="pi pi pi-pencil text-xl mb-1"></i>
                <span class="text-sm font-semibold">Редактировать</span>
              </Button>
            </template>
          </Card>

          <Card class="shadow-2 border-round-2xl mb-3">
            <template #content>
              <div class="flex justify-content-between align-items-center">
                <div class="flex align-items-center gap-2">
                  <div class="mb-3">
                    <div class="flex align-items-center">
                      <i class="pi pi-verified text-primary text-xl p-3"></i>
                      <div class="pl-2">
                        <h3 class="text-lg font-semibold m-0">Статус верификации</h3>
                        <p class="text-color-secondary m-0 text-sm mt-1">
                          {{ getVerificationStatus() }}
                        </p>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
              <Tag class="w-full"
                  :value="user.verified ? 'Подтверждён' : 'Не подтверждён'" 
                  :severity="user.verified ? 'success' : 'warning'"
                />
            </template>
          </Card>

          <Card class="shadow-2 border-round-2xl mb-3" v-if="!user.verified">
            <template #content>
              <div class="flex align-items-start gap-3">
                <i class="pi pi-star-fill text-warning text-xl"></i>
                <div>
                  <h4 class="font-semibold m-0 mb-2">Что даёт подтверждение через Госуслуги?</h4>
                  <ul class="text-sm m-0 pl-3">
                    <li>Доступ ко всем государственным льготам</li>
                    <li>Автоматическая проверка прав на льготы</li>
                    <li>Электронная подача заявлений</li>
                    <li>Статус льгот в реальном времени</li>
                  </ul>
                </div>
              </div>
            </template>
          </Card>

          <Card class="shadow-2 border-round-2xl mb-3">
            <template #content>
              <h3 class="text-lg font-semibold mb-3 mt-1">Мои льготы</h3>
              <div class="grid text-center">
                <div class="col-4">
                  <div class="flex flex-column align-items-center">
                    <span class="text-2xl font-bold text-warning">{{ stats.expiring || 0 }}</span>
                    <span class="text-color-secondary text-sm">Отправлено</span>
                  </div>
                </div>
                <div class="col-4">
                  <div class="flex flex-column align-items-center">
                    <span class="text-2xl font-bold text-primary">{{ stats.active || 0 }}</span>
                    <span class="text-color-secondary text-sm">Получено</span>
                  </div>
                </div>
                <div class="col-4">
                  <div class="flex flex-column align-items-center">
                    <span class="text-2xl font-bold text-success">{{ stats.recommended || 0 }}</span>
                    <span class="text-color-secondary text-sm">Отклонено</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <Card class="shadow-2 mb-3">
            <template #content>
              <div class="flex justify-content-between align-items-center">
                <h3 class="text-lg font-semibold m-0">Категории интересов</h3>
                <Button 
                  icon="pi pi-plus" 
                  @click="addInterest"
                  class="p-button-text p-button-sm"
                />
              </div>
              
              <div class="flex flex-wrap gap-2">
                <Chip 
                  v-for="interest in user.interests || []"
                  :key="interest"
                  :label="getInterestLabel(interest)"
                  :removable="true"
                  @remove="removeInterest(interest)"
                  class="mb-2 text-sm"
                />
                <p 
                  v-if="!user.interests || user.interests.length === 0"
                  class="text-color-secondary text-sm mt-0"
                >
                  Добавьте категории, чтобы получать персонализированные рекомендации
                </p>
              </div>
            </template>
          </Card>

          <Card class="shadow-2 border-round-2xl mb-4">
            <template #content>
              <div class="flex align-items-start gap-3">
                <div class="flex-1">
                  <div class="flex gap-2 mb-2">
                    <i class="pi pi-info-circle text-primary text-xl"></i>
                    <h4 class="text-lg font-semibold m-0 mb-2">Лимиты льгот</h4>
                  </div>
                  <div class="flex flex-column gap-3">
                    <div class="flex flex-column gap-2">
                      <div class="flex justify-content-between align-items-center">
                        <span class="text-sm font-medium">Использовано льгот</span>
                        <span class="text-sm font-bold">{{ getUsedBenefitsCount() }}/{{ getMaxBenefitsLimit() }}</span>
                      </div>
                      <small class="text-color-secondary text-xs">
                        {{ getBenefitsLimitText() }}
                      </small>
                    </div>

                    <div class="surface-50 border-round-lg py-3">
                      <div class="flex flex-column gap-2 text-sm">
                        <div class="flex justify-content-between">
                          <span class="text-color-secondary">Федеральные льготы:</span>
                          <span class="font-semibold">{{ getFederalLimitText() }}</span>
                        </div>
                        <div class="flex justify-content-between">
                          <span class="text-color-secondary">Региональные льготы:</span>
                          <span class="font-semibold">{{ getRegionalLimitText() }}</span>
                        </div>
                        <div class="flex justify-content-between">
                          <span class="text-color-secondary">Муниципальные льготы:</span>
                          <span class="font-semibold">{{ getMunicipalLimitText() }}</span>
                        </div>
                      </div>
                    </div>

                    <Message 
                      v-if="isNearLimit()" 
                      severity="warn" 
                      :closable="false"
                      class="text-xs"
                    >
                      <div class="flex align-items-center gap-2">
                        <span>Вы близки к максимальному количеству льгот. Осталось {{ getRemainingBenefits() }}.</span>
                      </div>
                    </Message>

                    <Message 
                      v-if="isLimitReached()" 
                      severity="error" 
                      :closable="false"
                      class="text-xs"
                    >
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-ban"></i>
                        <span>Достигнут лимит льгот. Для получения новых необходимо отказаться от существующих.</span>
                      </div>
                    </Message>
                  </div>
                </div>
              </div>
            </template>
          </Card>
          
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-4">Быстрые действия</h3>
            <div class="grid">
              <div class="col-6 p-1">
                <Button 
                  @click="$router.push('/favorites')"
                  class="p-button-outlined w-full h-4rem flex flex-column align-items-center justify-content-center"
                >
                  <i class="pi pi-heart text-xl mb-1"></i>
                  <span class="text-sm">Избранное</span>
                </Button>
              </div>
              <div class="col-6 p-1">
                <Button 
                  @click="goToMyBenefits"
                  class="p-button-outlined w-full h-4rem flex flex-column align-items-center justify-content-center"
                >
                  <i class="pi pi-folder text-xl mb-1"></i>
                  <span class="text-sm">Мои льготы</span>
                </Button>
              </div>
              <div class="col-6 p-1">
                <Button 
                  @click="exportToPDF"
                  :loading="exportingPdf"
                  class="p-button-outlined w-full h-4rem flex flex-column align-items-center justify-content-center"
                >
                  <i class="pi pi-file-pdf text-xl mb-1"></i>
                  <span class="text-sm">Экспорт в PDF</span>
                </Button>
              </div>
              <div class="col-6 p-1">
                <Button 
                  @click="goToDocuments"
                  class="p-button-outlined w-full h-4rem flex flex-column align-items-center justify-content-center"
                >
                  <i class="pi pi-file text-xl mb-1"></i>
                  <span class="text-sm">Документы</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer 
      :current-page="currentPage"
      :user="user"
      :profile-menu-items="profileMenuItems"
      @toggle-profile-menu="handleToggleProfileMenu"
      @menu-item-click="handleMenuItemClick"
      @go-to-home="handleGoToHome"
      @start-voice-search="handleStartVoiceSearch"
    />

    <Dialog 
      v-model:visible="showEditModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="edit-profile-modal"
      :style="{ width: '95vw', maxWidth: '500px', background: 'transparent', boxShadow: 'none' }"
      :showHeader="false"
      :contentStyle="{ padding: '0', margin: '0', background: 'transparent', border: 'none', boxShadow: 'none' }"
      :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }"
    >
      <template #closeicon>
        <i class="pi pi-times"></i>
      </template>

      <div class="relative">
        <Button 
          icon="pi pi-times" 
          @click="closeEditModal"
          class="p-button-text p-button-plain absolute top-0 right-0 m-3 z-5 bg-white border-circle shadow-2"
          style="width: 2.5rem; height: 2.5rem;"
        />

        <Card class="shadow-3 overflow-hidden border-none">
          <template #header>
            <div class="flex flex-column gap-3 p-4 pb-0">
              <h1 class="m-0 text-2xl font-bold line-height-3 text-primary flex justify-content-center">Редактирование</h1>
            </div>
          </template>

          <template #content>
            

            <div class="px-2 pt-0 flex flex-column gap-2">
              <section>
                <div class="flex flex-column align-items-center gap-2 mb-4">
                  <Avatar 
                    :image="editForm.avatar || undefined"
                    :label="editForm.avatar ? undefined : getEditFormInitials()" 
                    size="xlarge"
                    class="flex-shrink-0 cursor-pointer"
                    @click="openFileInput"
                  />
                  <input 
                    ref="avatarFileInput"
                    type="file" 
                    accept="image/*" 
                    style="display: none" 
                    @change="handleFileUpload"
                  />
                  <Button 
                    label="Изменить фото" 
                    @click="openFileInput"
                    class="p-button-text p-button-sm"
                  />
                  <small class="text-color-secondary text-xs">
                    Нажмите на аватар или кнопку для загрузки фото
                  </small>
                </div>
              </section>

              <section>
                <h3 class="text-lg font-bold mb-3">Основная информация</h3>
                
                <div class="flex flex-column gap-3">
                  <div class="field">
                    <label class="text-sm font-semibold mb-2 block">ФИО</label>
                    <InputText 
                      v-model="editForm.full_name" 
                      placeholder="Введите ваше полное имя"
                      class="w-full border-round-xl"
                      :class="{ 'p-invalid': editFormErrors.full_name }"
                    />
                    <small v-if="editFormErrors.full_name" class="p-error">{{ editFormErrors.full_name }}</small>
                  </div>

                  <div class="field">
                    <label class="text-sm font-semibold mb-2 block">Категория</label>
                    <Dropdown 
                      v-model="editForm.category"
                      :options="availableCategories"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Выберите категорию"
                      class="w-full border-round-xl"
                      :class="{ 'p-invalid': editFormErrors.category }"
                    />
                    <small v-if="editFormErrors.category" class="p-error">{{ editFormErrors.category }}</small>
                  </div>

                  <div class="field">
                    <label class="text-sm font-semibold mb-2 block">Регион</label>
                    <Dropdown 
                      v-model="editForm.region"
                      :options="availableRegions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Выберите регион"
                      class="w-full border-round-xl"
                      :class="{ 'p-invalid': editFormErrors.region }"
                    />
                    <small v-if="editFormErrors.region" class="p-error">{{ editFormErrors.region }}</small>
                  </div>

                  <div class="field">
                    <label class="text-sm font-semibold mb-2 block">Email</label>
                    <InputText 
                      v-model="editForm.email" 
                      placeholder="Введите ваш email"
                      class="w-full border-round-xl"
                      :class="{ 'p-invalid': editFormErrors.email }"
                    />
                    <small v-if="editFormErrors.email" class="p-error">{{ editFormErrors.email }}</small>
                  </div>

                  <div class="field">
                    <PhoneInput 
                      v-model="editForm.phone"
                      label="Телефон"
                      :error="editFormErrors.phone"
                      :required="true"
                      @validate="handlePhoneValidate"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div class="flex justify-content-between align-items-center">
                  <h3 class="text-lg font-bold m-0">Категории интересов</h3>
                  <Button 
                    icon="pi pi-plus" 
                    @click="addInterestInModal"
                    class="p-button-text p-button-sm"
                  />
                </div>
                
                <div class="flex flex-wrap gap-2">
                  <Chip 
                    v-for="interest in editForm.interests"
                    :key="interest"
                    :label="getInterestLabel(interest)"
                    :removable="true"
                    @remove="removeInterestInModal(interest)"
                    class="mb-2"
                  />
                  <p 
                    v-if="editForm.interests.length === 0"
                    class="text-color-secondary text-sm mt-0"
                  >
                    Добавьте категории интересов
                  </p>
                </div>
              </section>
            </div>
          </template>

          <template #footer>
            <div class="p-4 pt-2 flex flex-column gap-2">
              <div class="flex gap-2 md:flex-row md:align-items-center md:justify-content-between">
                <Button
                  label="Отмена"
                  @click="closeEditModal"
                  class="p-button-outlined w-full md:w-auto"
                />
                <Button
                  label="Сохранить изменения"
                  :loading="saving"
                  icon="pi pi-check"
                  class="p-button-primary w-full md:w-auto"
                  @click="saveProfile"
                />
              </div>
              
              <Button
                v-if="user.locallyModified"
                label="Синхронизировать с сервером"
                icon="pi pi-cloud-upload"
                class="p-button-help w-full"
                @click="syncWithServer"
                :loading="syncing"
              />
            </div>
          </template>
        </Card>
      </div>
    </Dialog>
    <Dialog 
      v-model:visible="showInterestSelectModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="interest-select-modal m-4"
      header="Выберите категорию интересов"
    >
      <div class="flex flex-column gap-3">
        <div 
          v-for="interest in getAvailableInterests()" 
          :key="interest.value"
          @click="selectInterest(interest.value)"
          class="flex align-items-center gap-3 p-3 cursor-pointer hover:surface-hover transition-colors transition-duration-200"
          :class="{ 'surface-ground': user.interests?.includes(interest.value) }"
        >
          <i :class="interest.icon" class="text-primary text-xl"></i>
          <span class="text-lg flex-1">{{ interest.label }}</span>
          <i 
            v-if="user.interests?.includes(interest.value)" 
            class="pi pi-check text-success text-xl"
          ></i>
        </div>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showDocumentsModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="documents-modal"
      header="Мои документы"
      :style="{ width: '95vw', maxWidth: '600px' }"
    >
      <div class="flex flex-column gap-4">
        <div v-if="documents.length > 0" class="flex flex-column gap-3">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="document-item surface-card border-round-xl p-4 shadow-1"
          >
            <div class="flex align-items-center justify-content-between">
              <div class="flex align-items-center gap-3 flex-1">
                <div class="document-icon bg-primary-100 border-round-lg p-3">
                  <i :class="getDocumentIcon(doc.type)" class="text-primary text-xl"></i>
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold m-0 mb-1">{{ doc.name }}</h4>
                  <p class="text-sm text-color-secondary m-0">{{ getDocumentTypeLabel(doc.type) }}</p>
                  <small class="text-xs text-color-secondary">
                    Добавлен {{ formatDate(doc.addedAt) }}
                  </small>
                </div>
              </div>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  class="p-button-text p-button-sm"
                  v-tooltip="'Просмотреть'"
                  @click="viewDocument(doc)"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button-text p-button-sm p-button-danger"
                  v-tooltip="'Удалить'"
                  @click="deleteDocument(doc.id)"
                />
              </div>
            </div>
            <div v-if="doc.number" class="mt-3 pt-3 border-top-1 surface-border">
              <div class="flex align-items-center gap-2">
                <span class="text-sm text-color-secondary">Номер:</span>
                <span class="text-sm font-semibold">{{ doc.number }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6">
          <i class="pi pi-folder text-6xl text-color-secondary mb-4"></i>
          <h3 class="text-xl font-bold mb-2">Нет документов</h3>
          <p class="text-color-secondary mb-4">Добавьте документы для быстрого доступа</p>
        </div>

        <div class="border-top-1 surface-border pt-4">
          <h3 class="text-lg font-bold mb-3">Добавить документ</h3>
          <div class="flex flex-column gap-3">
            <div class="field">
              <label class="text-sm font-semibold mb-2 block">Тип документа</label>
              <Dropdown
                v-model="newDocument.type"
                :options="documentTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Выберите тип документа"
                class="w-full"
              />
            </div>
            <div class="field">
              <label class="text-sm font-semibold mb-2 block">Название</label>
              <InputText
                v-model="newDocument.name"
                placeholder="Например: СНИЛС"
                class="w-full"
              />
            </div>
            <div class="field">
              <label class="text-sm font-semibold mb-2 block">Номер документа (необязательно)</label>
              <InputText
                v-model="newDocument.number"
                placeholder="Введите номер документа"
                class="w-full"
              />
            </div>
            <div class="field">
              <label class="text-sm font-semibold mb-2 block">Файл документа</label>
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style="display: none"
                @change="handleDocumentFileSelect"
              />
              <Button
                label="Выбрать файл"
                icon="pi pi-upload"
                class="p-button-outlined w-full"
                @click="$refs.fileInput.click()"
              />
              <small v-if="newDocument.fileName" class="text-sm text-color-secondary mt-2 block">
                Выбран: {{ newDocument.fileName }}
              </small>
            </div>
            <Button
              label="Добавить документ"
              icon="pi pi-plus"
              class="p-button-primary w-full"
              @click="addDocument"
              :disabled="!newDocument.type || !newDocument.name"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showInterestSelectModalInEdit" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="interest-select-modal"
      :style="{ width: '95vw', maxWidth: '500px' }"
      header="Выберите категорию интересов"
    >
      <div class="flex flex-column gap-3">
        <div 
          v-for="interest in getAvailableInterestsInEdit()" 
          :key="interest.value"
          @click="selectInterestInEdit(interest.value)"
          class="flex align-items-center gap-3 p-3 cursor-pointer hover:surface-hover transition-colors transition-duration-200"
          :class="{ 'surface-ground': editForm.interests?.includes(interest.value) }"
        >
          <i :class="interest.icon" class="text-primary text-xl"></i>
          <span class="text-lg flex-1">{{ interest.label }}</span>
          <i 
            v-if="editForm.interests?.includes(interest.value)" 
            class="pi pi-check text-success text-xl"
          ></i>
        </div>
      </div>
      <template #footer>
        <Button label="Закрыть" @click="showInterestSelectModalInEdit = false" class="p-button-text" />
      </template>
    </Dialog>

    <Dialog 
      v-model:visible="showDocumentViewer" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="document-viewer-modal"
      :header="viewingDocument ? viewingDocument.name : 'Просмотр документа'"
      :style="{ width: '95vw', maxWidth: '800px' }"
    >
      <div v-if="viewingDocument" class="flex flex-column gap-4">
        <div class="flex align-items-center gap-3 p-4 surface-card border-round-xl">
          <div class="document-icon bg-primary-100 border-round-lg p-3">
            <i :class="getDocumentIcon(viewingDocument.type)" class="text-primary text-xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold m-0 mb-1">{{ viewingDocument.name }}</h3>
            <p class="text-sm text-color-secondary m-0">{{ getDocumentTypeLabel(viewingDocument.type) }}</p>
            <small class="text-xs text-color-secondary">
              Добавлен {{ formatDate(viewingDocument.addedAt) }}
            </small>
          </div>
        </div>
        
        <div v-if="viewingDocument.number" class="p-4 surface-card border-round-xl">
          <div class="flex align-items-center gap-2 mb-2">
            <span class="text-sm font-semibold">Номер документа:</span>
            <span class="text-sm">{{ viewingDocument.number }}</span>
          </div>
        </div>

        <div v-if="viewingDocument.fileData" class="flex justify-content-center">
          <div class="document-preview border-round-xl overflow-hidden">
            <img 
              v-if="viewingDocument.fileName.match(/\.(jpg|jpeg|png)$/i)" 
              :src="viewingDocument.fileData" 
              alt="Превью документа"
              class="w-full"
              style="max-height: 500px; object-fit: contain;"
            />
            <iframe 
              v-else-if="viewingDocument.fileName.match(/\.pdf$/i)"
              :src="viewingDocument.fileData"
              class="w-full"
              style="height: 500px; border: none;"
            />
            <div v-else class="p-6 text-center">
              <i class="pi pi-file text-6xl text-color-secondary mb-3"></i>
              <p class="text-color-secondary">{{ viewingDocument.fileName }}</p>
              <Button
                label="Скачать файл"
                icon="pi pi-download"
                @click="downloadDocument(viewingDocument)"
                class="mt-3"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6">
          <i class="pi pi-file text-6xl text-color-secondary mb-3"></i>
          <p class="text-color-secondary">Файл не загружен</p>
        </div>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showGosuslugiBindModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      header="Привязка аккаунта Госуслуг"
      :style="{ width: '95vw', maxWidth: '500px' }"
      :maskStyle="{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)'
      }"
    >
      <div class="flex flex-column align-items-center gap-4 p-4">
        <i class="pi pi-shield-check text-6xl text-primary"></i>
        <div class="gosuslugi-logo"></div>
        <h3 class="text-xl font-bold text-center">Подтвердите личность через Госуслуги</h3>
        <p class="text-center text-color-secondary">
          Это откроет доступ ко всем государственным льготам и услугам
        </p>
        
        <Button 
          label="Войти через Госуслуги" 
          icon="pi pi-external-link"
          class="p-button-primary w-full"
          @click="redirectToGosuslugiAuth"
        />
        
        <small class="text-color-secondary text-center">
          После успешной авторизации вы вернётесь в приложение
        </small>
      </div>
    </Dialog>

  </div>
</template>

<script>
import { 
  usePageSetup,
  useProfile,
  onMounted,
  onActivated
} from '../utils/scripts.js'

import pdfExportService from '../services/pdfExport'
import { ref, watch, onUnmounted } from 'vue'
import VoiceAssistant from '../components/VoiceAssistant.vue'
import Footer from '../components/Footer.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputMask from 'primevue/inputmask'
import Sidebar from 'primevue/sidebar'
import PhoneInput from '../components/PhoneInput.vue'
import ProgressBar from 'primevue/progressbar'

export default {
  name: 'Profile',
  components: {
    VoiceAssistant,
    Footer,
    Card,
    Button,
    Chip,
    Tag,
    Avatar,
    ProgressSpinner,
    Message,
    Dialog,
    InputText,
    Dropdown,
    InputMask,
    Sidebar,
    PhoneInput,
    ProgressBar
  },
  
  setup() {
    const page = usePageSetup('profile')
    const profile = useProfile()

    const syncing = ref(false)

    const saveProfile = () => {
      console.log('Вызвана функция saveProfile')
      profile.saveProfile(page.user, page.loading, page.error)
    }

    const syncWithServer = () => {
      profile.syncWithServer(page.user)
    }

    const openEditModal = () => profile.openEditModal(page.user)
    const handleFileUpload = (event) => profile.handleFileUpload(event, page.user)
    const selectInterest = (interestValue) => profile.selectInterest(interestValue, page.user)
    const removeInterest = (interest) => profile.removeInterest(interest, page.user)
    const getVerificationStatus = () => profile.getVerificationStatus(page.user)
    const getUserCategory = () => profile.getUserCategory(page.user)
    const getUserInitials = () => profile.getUserInitials(page.user)
    const getEditFormInitials = () => profile.getEditFormInitials()
    const getRegionLabel = (value) => profile.getRegionLabel(value)
    const getInterestLabel = (interestValue) => profile.getInterestLabel(interestValue)
    const getCategoryIcon = (category) => profile.getCategoryIcon(category)
    const getAvailableInterests = () => profile.getAvailableInterests()
    const getAvailableInterestsInEdit = () => profile.getAvailableInterestsInEdit()
    const selectInterestInEdit = (interestValue) => profile.selectInterestInEdit(interestValue)
    const addInterestInModal = () => profile.addInterestInModal()
    const removeInterestInModal = (interest) => profile.removeInterestInModal(interest)
    const addInterest = () => profile.addInterest()
    const avatarFileInput = ref(null)
    const openFileInput = () => {
      avatarFileInput.value?.click()
    }
    const closeEditModal = () => profile.closeEditModal()
    
    const goToSettings = () => profile.goToSettings()
    const goToMyBenefits = () => profile.goToMyBenefits()
    const goToRecommended = () => profile.goToRecommended()
    const showBenefitDetails = (benefit) => profile.showBenefitDetails(benefit)
    
    const handlePhoneValidate = (error) => {
      profile.editFormErrors.phone = error
    }

    const goToApplications = () => {
      alert('Функция экспорта в PDF в разработке')
    }
    
    const showDocumentsModal = ref(false)
    const documents = ref([])
    const newDocument = ref({
      type: null,
      name: '',
      number: '',
      file: null,
      fileName: ''
    })
    const fileInput = ref(null)
    const viewingDocument = ref(null)
    const showDocumentViewer = ref(false)

    const documentTypes = [
      { label: 'СНИЛС', value: 'snils' },
      { label: 'Паспорт', value: 'passport' },
      { label: 'Водительское удостоверение', value: 'driver_license' },
      { label: 'Справка об инвалидности', value: 'disability_certificate' },
      { label: 'Пенсионное удостоверение', value: 'pension_certificate' },
      { label: 'Справка о доходах', value: 'income_certificate' },
      { label: 'Другое', value: 'other' }
    ]

    const loadDocuments = () => {
      try {
        const saved = localStorage.getItem('userDocuments')
        if (saved) {
          documents.value = JSON.parse(saved)
        }
      } catch (e) {
        console.error('Ошибка загрузки документов:', e)
        documents.value = []
      }
    }

    const saveDocuments = () => {
      try {
        localStorage.setItem('userDocuments', JSON.stringify(documents.value))
      } catch (e) {
        console.error('Ошибка сохранения документов:', e)
      }
    }

    const getDocumentIcon = (type) => {
      const icons = {
        snils: 'pi pi-id-card',
        passport: 'pi pi-id-card',
        driver_license: 'pi pi-car',
        disability_certificate: 'pi pi-file',
        pension_certificate: 'pi pi-file',
        income_certificate: 'pi pi-file',
        other: 'pi pi-file'
      }
      return icons[type] || 'pi pi-file'
    }

    const getDocumentTypeLabel = (type) => {
      const typeObj = documentTypes.find(t => t.value === type)
      return typeObj ? typeObj.label : 'Документ'
    }

    const handleDocumentFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert('Файл слишком большой. Максимальный размер: 10 МБ')
          return
        }
        newDocument.value.file = file
        newDocument.value.fileName = file.name
        
        const reader = new FileReader()
        reader.onload = (e) => {
          newDocument.value.fileData = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const addDocument = () => {
      if (!newDocument.value.type || !newDocument.value.name) {
        return
      }

      const document = {
        id: Date.now(),
        type: newDocument.value.type,
        name: newDocument.value.name,
        number: newDocument.value.number || '',
        fileName: newDocument.value.fileName || '',
        fileData: newDocument.value.fileData || null,
        addedAt: new Date().toISOString()
      }

      documents.value.push(document)
      saveDocuments()

      newDocument.value = {
        type: null,
        name: '',
        number: '',
        file: null,
        fileName: '',
        fileData: null
      }
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const deleteDocument = (id) => {
      if (confirm('Вы уверены, что хотите удалить этот документ?')) {
        const index = documents.value.findIndex(d => d.id === id)
        if (index > -1) {
          documents.value.splice(index, 1)
          saveDocuments()
        }
      }
    }

    const viewDocument = (doc) => {
      viewingDocument.value = doc
      showDocumentViewer.value = true
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    const downloadDocument = (doc) => {
      if (!doc.fileData) {
        alert('Файл не найден')
        return
      }
      
      const link = document.createElement('a')
      link.href = doc.fileData
      link.download = doc.fileName || `${doc.name}.${doc.fileData.split(';')[0].split('/')[1]}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    const goToDocuments = () => {
      loadDocuments()
      showDocumentsModal.value = true
    }
    
    const findNewBenefits = () => {
      alert('Функция поиска новых льгот в разработке')
    }
    
    const openBenefit = (benefit) => {
      alert(`Льгота: ${benefit?.title || 'Неизвестная льгота'}`)
    }

    const goToBenefitCategory = (category) => {
      page.router.push({ name: 'Search', query: { category } })
    }

    const handleToggleProfileMenu = (isVisible) => {
      page.showProfileMenu.value = isVisible
    }

    const handleMenuItemClick = (item) => {
      if (item.action) {
        item.action()
      }
    }

    const handleGoToHome = () => {
      if (page.currentPage !== 'benefits') {
        page.router.push('/')
      }
    }

    const handleStartVoiceSearch = () => {
      page.startVoiceSearch()
    }

    const exportingPdf = ref(false)

    const exportToPDF = async () => {
      exportingPdf.value = true
      
      try {
        const userBenefits = await fetchUserBenefits()
        
        if (!userBenefits || userBenefits.length === 0) {
          alert('У вас нет заявок на льготы для экспорта')
          return
        }
        
        const fileName = `льготы_${page.user.value.full_name || 'пользователь'}_${new Date().toISOString().split('T')[0]}.pdf`
        
        const success = pdfExportService.exportBenefitsToPDF(
          page.user.value,
          userBenefits,
          fileName
        )
        
        if (success) {
          console.log('PDF успешно экспортирован')
        } else {
          alert('Произошла ошибка при экспорте PDF')
        }
      } catch (error) {
        console.error('Ошибка экспорта:', error)
        alert('Не удалось экспортировать данные в PDF')
      } finally {
        exportingPdf.value = false
      }
    }

    const fetchUserBenefits = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error('Пользователь не авторизован')
        }
        
        const response = await fetch('/api/users/requests/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных')
        }
        
        const data = await response.json()
        return data
      } catch (error) {
        console.error('Ошибка загрузки льгот:', error)
        return []
      }
    }

    const checkGosuslugiStatus = async () => {
      try {
        const response = await fetch('/api/auth/gosuslugi/status')
        const data = await response.json()
        page.user.value.gosuslugiLinked = data.linked
        page.user.value.verified = data.verified
      } catch (error) {
        console.error('Ошибка проверки статуса Госуслуг:', error)
      }
    }

    const getVerificationStatusText = () => {
      if (page.user.value.verified) return 'Учётная запись подтверждена'
      if (page.user.value.gosuslugiLinked) return 'Привязан аккаунт Госуслуг. Требуется проверка документов'
      return 'Требуется подтверждение личности через Госуслуги'
    }
    
    const getVerificationProgress = () => {
      if (page.user.value.verified) return 100
      if (page.user.value.gosuslugiLinked) return 66
      return 33
    }

    const getVerificationLevel = () => {
      if (page.user.value.verified) return 3
      if (page.user.value.gosuslugiLinked) return 2
      return 1
    }

    const showGosuslugiBindModal = ref(false)

    const redirectToGosuslugiAuth = () => {
      showGosuslugiBindModal.value = false
    }

    const getStatusSeverity = (status) => {
      const statusMap = {
        'approved': 'success',
        'pending': 'warning', 
        'rejected': 'danger',
        'draft': 'info'
      }
      return statusMap[status] || 'secondary'
    }

    const getMaxBenefitsLimit = () => {
      const baseLimit = 5;
      
      if (page.user.value?.category === 'disabled') {
        return 7; 
      } else if (page.user.value?.category === 'veteran') {
        return 6; 
      } else if (page.user.value?.category === 'family') {
        return 8; 
      }
      
      return baseLimit;
    }

    const getUsedBenefitsCount = () => {
      if (!profile.stats || !profile.stats.value) {
        console.log('Статистика не загружена:', { stats: profile.stats })
        return 0;
      }
      
      const activeBenefits = profile.stats.value.active || 0;
      console.log('Количество одобренных льгот:', activeBenefits, 'Статистика:', profile.stats.value)
      
      return activeBenefits;
    }

    const animatedProgressPercent = ref(0);
    
    const getBenefitsUsagePercent = () => {
      const used = getUsedBenefitsCount();
      const max = getMaxBenefitsLimit();
      return Math.min((used / max) * 100, 100);
    }
    
    watch(() => {
      return profile.stats.value?.active ?? 0;
    }, () => {
      const newValue = getBenefitsUsagePercent();
      const startValue = animatedProgressPercent.value;
      const endValue = newValue;
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        animatedProgressPercent.value = startValue + (endValue - startValue) * easeOutCubic;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          animatedProgressPercent.value = endValue;
        }
      };
      
      requestAnimationFrame(animate);
    }, { immediate: true });

    const getBenefitsLimitText = () => {
      const used = getUsedBenefitsCount();
      const max = getMaxBenefitsLimit();
      const remaining = max - used;
      
      if (remaining <= 0) {
        return 'Лимит льгот исчерпан';
      } else if (remaining === 1) {
        return `Осталась 1 льгота из ${max} возможных`;
      } else if (remaining <= 3) {
        return `Осталось ${remaining} льготы из ${max} возможных`;
      } else {
        return `Можно получить до ${max} льгот одновременно`;
      }
    }

    const getFederalLimitText = () => {
      const federalLimit = 3;
      const federalUsed = Math.min(getUsedBenefitsCount(), federalLimit);
      return `${federalUsed}/${federalLimit}`;
    }

    const getRegionalLimitText = () => {
      const regionalLimit = 2;
      const regionalUsed = Math.min(Math.max(0, getUsedBenefitsCount() - 3), regionalLimit);
      return `${regionalUsed}/${regionalLimit}`;
    }

    const getMunicipalLimitText = () => {
      const municipalLimit = 2;
      const municipalUsed = Math.min(Math.max(0, getUsedBenefitsCount() - 5), municipalLimit); 
      return `${municipalUsed}/${municipalLimit}`;
    }

    const isNearLimit = () => {
      const used = getUsedBenefitsCount();
      const max = getMaxBenefitsLimit();
      return used >= max - 1 && used < max;
    }

    const isLimitReached = () => {
      return getUsedBenefitsCount() >= getMaxBenefitsLimit();
    }

    const getRemainingBenefits = () => {
      const used = getUsedBenefitsCount();
      const max = getMaxBenefitsLimit();
      const remaining = max - used;
      return remaining > 0 ? remaining : 0;
    }

    const getProgressBarClass = () => {
      const percent = getBenefitsUsagePercent();
      if (percent >= 100) {
        return 'p-progressbar-danger';
      } else if (percent >= 80) {
        return 'p-progressbar-warning';
      } else {
        return 'p-progressbar-success';
      }
    }

    const handleBenefitRequestStatusChange = async () => {
      await profile.loadUserStats()
    }
    
    const handleBenefitRequestCreated = async () => {
      await profile.loadUserStats()
    }

    onMounted(() => {
      console.log('Profile component mounted')
      const localUser = localStorage.getItem('user')
      if (localUser) {
        try {
          page.user.value = JSON.parse(localUser)
        } catch (e) {
          console.warn('Ошибка загрузки из localStorage:', e)
        }
      }
      profile.loadProfileData(page.user, page.loading, page.error)
      
      window.addEventListener('benefit-request-created', handleBenefitRequestCreated)
      window.addEventListener('benefit-request-status-changed', handleBenefitRequestStatusChange)
    })
    
    onUnmounted(() => {
      window.removeEventListener('benefit-request-created', handleBenefitRequestCreated)
      window.removeEventListener('benefit-request-status-changed', handleBenefitRequestStatusChange)
    })

    onActivated(() => {
      console.log('Profile component activated')
      profile.loadUserData(page.user)
      profile.loadUserStats()
      if (page.user.value.gosuslugiLinked && !page.user.value.verified) {
        checkVerificationStatus()
      }

      const checkVerificationStatus = async () => {
        try {
          const response = await fetch('/api/auth/verification-status')
          const data = await response.json()
          
          if (data.verified && !page.user.value.verified) {
            page.user.value.verified = true
            localStorage.setItem('user', JSON.stringify(page.user.value))
          }
        } catch (error) {
          console.error('Ошибка проверки статуса верификации:', error)
        }
      }
    })

    const getProgressBarSeverity = () => {
      const percent = getBenefitsUsagePercent();
      if (percent >= 100) {
        return 'error';
      } else if (percent >= 80) {
        return 'warn';
      } else {
        return 'success';
      }
    }

    return {
      ...page,
      ...profile,
      syncing,
      handleToggleProfileMenu,
      handleMenuItemClick,
      handleGoToHome,
      handleStartVoiceSearch,
      openEditModal,
      handleFileUpload,
      saveProfile, 
      selectInterest,
      removeInterest,
      getVerificationStatus,
      getUserInitials,
      getUserCategory,
      getRegionLabel,
      getEditFormInitials,
      getInterestLabel,
      getCategoryIcon,
      getAvailableInterests,
      getAvailableInterestsInEdit,
      selectInterestInEdit,
      addInterestInModal,
      removeInterestInModal,
      addInterest,
      avatarFileInput,
      openFileInput,
      closeEditModal,
      goToSettings,
      goToMyBenefits,
      goToRecommended,
      showBenefitDetails,
      goToApplications,
      goToDocuments,
      findNewBenefits,
      openBenefit,
      goToBenefitCategory,
      handlePhoneValidate,
      exportingPdf,
      showDocumentsModal,
      documents,
      newDocument,
      fileInput,
      documentTypes,
      addDocument,
      deleteDocument,
      viewDocument,
      getDocumentIcon,
      getDocumentTypeLabel,
      handleDocumentFileSelect,
      formatDate,
      viewingDocument,
      showDocumentViewer,
      downloadDocument,
      exportToPDF,
      syncWithServer,
      showDocumentsModal,
      documents,
      newDocument,
      fileInput,
      documentTypes,
      addDocument,
      deleteDocument,
      viewDocument,
      getDocumentIcon,
      getDocumentTypeLabel,
      handleDocumentFileSelect,
      viewingDocument,
      showDocumentViewer,
      downloadDocument,
      showGosuslugiBindModal,
      redirectToGosuslugiAuth,
      checkGosuslugiStatus,
      getVerificationProgress,
      getVerificationLevel,
      getVerificationStatusText,
      getStatusSeverity,
      getMaxBenefitsLimit,
      getUsedBenefitsCount,
      getBenefitsUsagePercent,
      getBenefitsLimitText,
      getFederalLimitText,
      getRegionalLimitText,
      getMunicipalLimitText,
      isNearLimit,
      isLimitReached,
      getRemainingBenefits,
      getProgressBarClass,
      getProgressBarSeverity,

      getTypeLabel: (type) => ({ federal: 'Федеральная', regional: 'Региональная', municipal: 'Муниципальная', commercial: 'Коммерческая' }[type] || type),
      getTypeSeverity: (type) => ({ federal: 'info', regional: 'success', municipal: 'warning', commercial: 'help' }[type] || 'secondary')
    }
  }
}
</script>

<style>
:deep(.p-progressbar) {
  height: 0.75rem;
  border-radius: 6px;
}

:deep(.p-progressbar-value) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.p-progressbar-danger .p-progressbar-value) {
  background: linear-gradient(45deg, #f87171, #ef4444) !important;
}

:deep(.p-progressbar-warning .p-progressbar-value) {
  background: linear-gradient(45deg, #fbbf24, #f59e0b) !important;
}

:deep(.p-progressbar-success .p-progressbar-value) {
  background: linear-gradient(45deg, #34d399, #10b981) !important;
}
</style>