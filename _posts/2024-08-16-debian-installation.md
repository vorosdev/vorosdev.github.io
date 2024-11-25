---
title: INSTALACIÓN MANUAL DE DEBIAN CON SYSTEMD 
description: Cómo hacer una instalación manual de Debian con BTRFS + LUKS2 + Systemd-Boot.
author: Vor
date: 2024-08-13
categories: [Guides, Linux]
tags: [linux, guide, installation, systemd]
image:
  path: /assets/img/posts/guides/linux/debian-systemd.webp
  alt: Debian logo
---

## Pre-instalación

###### Descargar la ISO
Voy a utilizar el live de Debian para iniciar, pero también se puede usar cualquier otra distro con modo live. 
Puedes descargar la ISO desde el siguiente enlace:  
[Debian Live](https://www.debian.org/CD/live/)

##### Opcional: Instalar de forma remota
```bash
sudo passwd user # Asignamos una contraseña al usuario
sudo apt install ssh # Instalamos el servidor SSH
```

###### Instalación de paquetes
Nos hacemos root con `sudo su`:

```bash
apt install debootstrap cryptsetup arch-install-scripts dosfstools btrfs-progs gdisk
```

## Particionado del disco

Particionamos el disco en dos particiones: una para el gestor de arranque y otra para el sistema.

```bash
# Disco a utilizar
export DISK=/dev/sda # Cambia esto al disco que corresponda, puedes verificar con lsblk

# Limpiar la tabla de particiones
sgdisk --zap-all $DISK

# Partición 1 - EFI
sgdisk -n 1:2048:+512M -t 1:EF00 $DISK

# Partición 2 - Linux LUKS
sgdisk -n 2:0:0 -t 2:8309 $DISK
```

###### Creación del sistema de archivos
```bash
# Formatear la partición EFI
mkfs.fat -F 32 -n EFI ${DISK}1

# Crear el contenedor LUKS para BTRFS
cryptsetup -v luksFormat --type luks2 --hash sha512 ${DISK}2

# Abrir el contenedor LUKS, introduce la contraseña que diste en el paso anterior
cryptsetup open ${DISK}2 cryptroot

# Crear el sistema de archivos BTRFS
mkfs.btrfs /dev/mapper/cryptroot
```

###### Crear los subvolúmenes de BTRFS y montarlos
```bash
# Montar el contenedor LUKS en /mnt
mount /dev/mapper/cryptroot /mnt

# Crear los subvolúmenes
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@swap 

# Desmontar el sistema de archivos BTRFS de /mnt
umount /mnt

# Montar el subvolumen de root
mount -o noatime,compress=zstd:1,subvol=@ /dev/mapper/cryptroot /mnt

# Creación de directorios para otros subvolúmenes
mkdir -p /mnt/{boot,home,.snapshots}

# Montar los otros subvolúmenes
mount -o noatime,compress=zstd:1,subvol=@home /dev/mapper/cryptroot /mnt/home
mount -o noatime,compress=zstd:1,subvol=@snapshots /dev/mapper/cryptroot /mnt/.snapshots

# Montar la partición EFI
mkdir /mnt/boot/efi
mount ${DISK}1 /mnt/boot/efi

## Opcional ##
# Creación y uso de swapfile
mkdir -p /mnt/swap
mount -o subvol=@swap /dev/mapper/cryptroot /mnt/swap
btrfs filesystem mkswapfile --size 16G /mnt/swap/swapfile # Puedes modificar la cantidad de GB que le asignas
swapon /mnt/swap/swapfile
```

## Instalación con debootstrap
Creamos el árbol de directorios usando `debootstrap`. En este caso, usaré la última versión estable, **Bookworm**:

```bash
debootstrap --arch amd64 bookworm /mnt 
```

###### Configuración del sistema

Crearemos un subvolumen solo para los logs, de modo que podamos excluirlos de las snapshots de root.

```bash
mv /mnt/var/log /mnt/var/log-old
btrfs subvolume create /mnt/var/log
cp -a /mnt/var/log-old/* /mnt/var/log/
rm -rf /mnt/var/log-old
```

Montamos los sistemas de archivos virtuales:

```bash
mount -o bind /dev /mnt/dev
mount -o bind /dev/pts /mnt/dev/pts
mount -o bind /proc /mnt/proc
mount -o bind /sys /mnt/sys
mount -o bind /sys/firmware/efi/efivars /mnt/sys/firmware/efi/efivars
```

Generamos el archivo `fstab` con la utilidad `genfstab` del paquete `arch-install-scripts`:

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

Creamos el archivo `crypttab`:

```bash
# Con `blkid` vamos a obtener el UUID de la partición encriptada (por ejemplo: sda2), no del contenedor LUKS (cryptroot)
blkid

export CRYPTROOT_UUID=uuid-de-la-particion-encriptada
echo -e "cryptroot\tUUID=$CRYPTROOT_UUID\tnone\tluks" > /mnt/etc/crypttab
```

Entramos en un entorno `chroot` y hacemos una configuración básica:

```bash
# Entrar al `chroot` solo si se montaron de forma correcta los sistemas de archivos virtuales 
chroot /mnt /bin/bash

apt install locales console-setup vim

dpkg-reconfigure tzdata
dpkg-reconfigure locales
dpkg-reconfigure console-setup

export HOSTNAME=tunombredehost
echo $HOSTNAME > /etc/hostname
echo "127.0.1.1 $HOSTNAME.localdomain $HOSTNAME" >> /etc/hosts
```

Configuramos los mirrors para el gestor de paquetes `apt`. Puedes tomar como ejemplo la `sources.list` de Debian:  
[Debian SourcesList](https://wiki.debian.org/SourcesList)

```bash
vim /etc/apt/sources.list # Abre el archivo para ingresar los mirrors

deb http://deb.debian.org/debian bookworm main non-free-firmware
deb-src http://deb.debian.org/debian bookworm main non-free-firmware

deb http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware
deb-src http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware

deb http://deb.debian.org/debian bookworm-updates main non-free-firmware
deb-src http://deb.debian.org/debian bookworm-updates main non-free-firmware
```

Actualizamos la lista de repositorios e instalamos el kernel junto a otras utilidades:

```bash 
apt update
apt install linux-image-amd64 linux-headers-amd64 network-manager firmware-linux firmware-iwlwifi firmware-linux-nonfree bash-completion command-not-found btrfs-progs sudo neovim usbutils hwinfo connman wget curl htop
```

Asignamos una contraseña a root:

```bash 
passwd
```

Añadimos un usuario normal y le asignamos sus grupos:

```bash 
useradd -m -c "user" -s /bin/bash user
passwd user 
usermod -aG sudo,adm,dialout,cdrom,floppy,audio,dip,video,plugdev,users,netdev,bluetooth user
```

##### Instalacion de microcodigo 
```bash
apt install amd64-microcode # para procesadores de AMD
apt install intel-microcode # para procesadores de Intel
```

## Instalación del bootloader

```bash
apt install efibootmgr systemd-boot cryptsetup-initramfs
```

##### Configurar `systemd-boot`:

```bash
bootctl install
```

Revisa que se haya creado la entrada correcta en `boot/efi/loader/entries/id-example.conf`, por ejemplo: 
`4ddcd3b3f8774ee39a8b04175a61cf61-6.1.0-23-amd64.conf`. Si no se genera o se genera de forma incorrecta, sigue los siguientes pasos:

```bash
cd /boot/efi/loader/entries/
vim debian.conf # Creamos un archivo de configuración temporal e ingresamos lo siguiente

title      Debian GNU/Linux
linux      /4ddcd3b3f8774ee39a8b04175a61cf61/6.1.0-23-amd64/linux # Aquí puede variar la ruta, es probable que esté en /boot
initrd     /4ddcd3b3f8774ee39a8b04175a61cf61/6.1.0-23-amd64/initrd.img-6.1.0-23-amd64 # Mismo caso que el anterior
options    cryptdevice=UUID=UUID-Particion-Encriptada:cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw rootfstype=btrfs  
# La UUID es de la partición encriptada (por ejemplo, sda2 o lo que corresponda)
```

Editar el `loader.conf`, que se encuentra en `/boot/efi/loader/loader.conf`:

```bash
default debian-*
timeout 3
console-mode keep
```

Una vez finalizado esto, deberíamos poder arrancar Debian sin problemas. Después de arrancar por primera vez, eliminaremos el archivo 
`debian.conf` y lo quitaremos de `loader.conf`. Acto seguido, ejecutamos `update-initramfs -u`, de esta forma se creará automáticamente 
y de forma correcta el archivo `id-example.conf` que anteriormente no se había generado como debería. Aquí ya no debería haber 
inconvenientes, dado que el mismo sistema actualizará o generará el archivo de forma automática en cada actualización de las initramfs.

## Instalación de un escritorio (opcional)

```bash
apt install gnome-core -y
```

## Final

Ahora podemos reiniciar, solo es necesario desmontar los sistemas de archivos:

```bash
# Salimos del chroot
exit

# Desmontamos los sistemas de archivos
umount /mnt/boot/efi
umount /mnt/{dev/pts,dev,proc,sys}
umount /mnt
```

Reiniciamos el equipo:

```bash
reboot
```
