import { Camera } from '@capacitor/camera';
import { CameraResultType } from '@capacitor/camera';
import { CameraSource } from '@capacitor/camera';
import { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/vue';
import { onMounted } from 'vue';
import { ref } from 'vue';
import { watch } from 'vue';

// Define el tipo de foto que guarda/muestra
export interface UserPhoto
{
    filepath: string;
    webviewPath?: string;
}

export const usePhotoGallery = () =>
{
    // Clave para persistir el arreglo de fotos en el almacenamiento
    const PHOTO_STORAGE = 'photos';

    // Estado reactivo con la lista de fotos
    const photos = ref<UserPhoto[]>([]);

    // Convierte un Blob a Base64
    const convertBlobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => { resolve(reader.result as string); };
        reader.readAsDataURL(blob);
    });

    // Persiste la lista de fotos en Preferences
    const cachePhotos = () =>
    {
        Preferences.set({
            key: PHOTO_STORAGE,
            value: JSON.stringify(photos.value),
        }).then(_ => {});
    };

    // Carga las fotos desde el almacenamiento
    const loadSaved = async () =>
    {
        const photoList = await Preferences.get({ key: PHOTO_STORAGE });
        const photosInPreferences = photoList.value ? JSON.parse(photoList.value) : [];

        // Si es web, se requiere convertir los archivos a Data URL
        if (!isPlatform('hybrid'))
        {
            for (const photo of photosInPreferences)
            {
                const file = await Filesystem.readFile({
                    path: photo.filepath,
                    directory: Directory.Data,
                });

                photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
            }
        }

        photos.value = photosInPreferences;
    };

    // Guarda la foto en el almacenamiento y retorna los metadatos (UserPhoto)
    const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> =>
    {
        let base64Data: string;

        // Convertir la foto a base64 dependiendo de la plataforma

        // Convertir la foto para no-web
        if (isPlatform('hybrid'))
        {
            const file = await Filesystem.readFile({ path: photo.path! });

            if (typeof file.data === 'string')
            {
                base64Data = file.data;
            }
            else
            {
                base64Data = await convertBlobToBase64(file.data);
            }
        }
        // Convertir la foto para web
        else
        {
            const response = await fetch(photo.webPath!);
            const blob = await response.blob();
            base64Data = await convertBlobToBase64(blob);
        }

        // Escribir el archivo en el almacenamiento
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data,
        });

        // Retornar el objeto UserPhoto dependiendo de la plataforma

        // Retornar UserPhoto para no-web
        if (isPlatform('hybrid'))
        {
            return {
                filepath: savedFile.uri,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri),
            };
        }
        // Retornar UserPhoto para web
        else
        {
            return {
                filepath: fileName,
                webviewPath: photo.webPath,
            };
        }
    };

    // Elimina una foto del almacenamiento
    const deletePhoto = async (photo: UserPhoto) =>
    {
        // Eliminar la foto del array reactivo
        photos.value = photos.value.filter((p) => p.filepath !== photo.filepath);

        // Obtener el nombre del archivo
        const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

        // Eliminar la foto del almacenamiento
        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data,
        });
    };

    // Toma una foto con la cámara y la guarda
    const takePhoto = async () =>
    {
        // Obtener la foto tomada por la cámara
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100,
        });

        // Generar un nombre único para la foto
        const fileName = new Date().getTime() + '.jpeg';
        const savedFileImage = await savePicture(photo, fileName);

        // Guardar la foto en la galería
        photos.value = [savedFileImage, ...photos.value];
    };

    // Al iniciar la app, cargar lo persistido y cada cambio nuevo se guarda en el almacenamiento
    onMounted(loadSaved);
    watch(photos, cachePhotos);

    // Exponer la API del composable con las funcionalidades
    return {
        photos,
        deletePhoto,
        takePhoto,
    };
};
