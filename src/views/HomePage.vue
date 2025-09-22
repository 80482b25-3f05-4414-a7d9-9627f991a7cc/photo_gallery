<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Galería de Fotos (UCompensar)</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col size="6" v-for="photo in photos" :key="photo.filepath">
            <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
          </ion-col>
        </ion-row>
      </ion-grid>
      <ion-fab vertical="bottom" horizontal="center" slot="fixed">
        <ion-fab-button @click="takePhoto()">
          <ion-icon :icon="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { usePhotoGallery } from '@/composables/usePhotoGallery';
  import { UserPhoto } from '@/composables/usePhotoGallery';
  import { actionSheetController } from '@ionic/vue';
  import { IonCol } from '@ionic/vue';
  import { IonContent } from '@ionic/vue';
  import { IonFab } from '@ionic/vue';
  import { IonFabButton } from '@ionic/vue';
  import { IonGrid } from '@ionic/vue';
  import { IonHeader } from '@ionic/vue';
  import { IonIcon } from '@ionic/vue';
  import { IonImg } from '@ionic/vue';
  import { IonPage } from '@ionic/vue';
  import { IonRow } from '@ionic/vue';
  import { IonTitle } from '@ionic/vue';
  import { IonToolbar } from '@ionic/vue';
  import { camera } from 'ionicons/icons';
  import { close } from 'ionicons/icons';
  import { trash } from 'ionicons/icons';

  const { photos, takePhoto, deletePhoto } = usePhotoGallery();

  const showActionSheet = async (photo: UserPhoto) =>
  {
    const actionSheet = await actionSheetController.create({
      header: 'Fotos',
      buttons: [
        {
          icon: trash,
          role: 'destructive',
          text: 'Eliminar',
          handler: () => {
            deletePhoto(photo);
          },
        },
        {
          icon: close,
          role: 'cancel',
          text: 'Cancelar',
          handler: () => { },
        },
      ],
    });
    await actionSheet.present();
  };
</script>
