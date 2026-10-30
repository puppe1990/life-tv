# LIFE TV 4.0 (`com.lifetv.app`) — achados de engenharia reversa

Notas da análise estática e dinâmica do APK de referência (`LIFE TV.apk`, 28 MB,
versionCode 41, targetSdk 33). Servem para entender o protocolo que este núcleo
reimplementa — nenhum segredo do app original é reproduzido aqui.

## Superfície

- Activities: `com.andyhax.veeepeeen.ui.login.LoginActivity` → `com.flextv.livestore.MainActivity`
  → `com.flextv.livestore.activities.HomeActivity` (+ Live, Category, CatchUp, ChangePlaylist,
  AddGroup, Sport, `com.andyhax.MainActivity`).
- Permissões: `WRITE_SETTINGS`, `RECEIVE_BOOT_COMPLETED`, storage, WAKE_LOCK, FOREGROUND_SERVICE.
- Libs: `libffmpegJNI`, `libhax` (packer/dex2c + `DccApplication`), `realm-jni`, `pl_droidsonroids_gif`.

## Empacotamento

- Parte das classes virou código nativo (`dex2c`) dentro de `libhax.so` (ELF ARM64, stripped).
  `MainActivity`, `JsonTask`, `GetMAC`, `Crypt*` só existem como JNI.
- `JNI_OnLoad` aborta o processo fora do APK original. Patch aplicado para o harness:
  offset de arquivo `164288`, `movz w0,#6; movk w0,#1,lsl 16; ret; nop` → retorna `JNI_VERSION_1_6`.

## Ofuscação de strings

- `com.andyhax.StringDecoder.decode`: XOR 5 por char.
- `com.andyhax.CryptMtx`: hex + chave fixa de 54 caracteres embutida no APK (não reproduzida aqui).
  Algoritmo: inverte a string, percorre de 2 em 2, `(hex - key[j] - j + 256) % 256`, ISO-8859-1 → UTF-8.

| Constante      | Valor                                |
| -------------- | ------------------------------------ |
| `V_AN`         | `LIFE TV`                            |
| `V_PA`         | `com.lifetv.app`                     |
| `getD`         | `mhso`                               |
| `getM`         | `mtx`                                |
| `getMac`       | `?MAC=`                              |
| `getDevicePhp` | `device.php`                         |
| `getMsgPhp`    | `msg.php`                            |
| `getQrPhp`     | `qr.php`                             |
| `mtx()`        | `https://zlifeibo.znext.com.br/api/` |

## Handshake do painel

- Device id: `6ff05ca97877ad7` (exibido como `6FF05CA9`).
- Requisição: `https://zlifeibo.znext.com.br/api//?mac=<base64(base64(deviceId))>`.
- Resposta: `{"data":"<base64>"}` — 1.136 bytes (múltiplo de 16).
- Decifra: `com.andyhax.Crypt$yYnwelntFgKtefBHbkKP.RSY1ccjOzXsi2Dk640TH(String)`.
- As demais JNI do `Crypt` devolvem tokens de 16 chars (chaves erradas no mesmo payload).

Payload decifrado:

```json
{
  "portals": [
    { "name": "ZEUS", "url": "http://futurenethost.online", "id": 1 },
    { "name": "Blazer", "url": "http://morvcdn.online", "id": 3 },
    { "name": "Natv ( TopTv)", "url": "http://yt19.org", "id": 10 },
    { "name": "Lave21 ", "url": "http://foxlive.top", "id": 15 },
    { "name": "Rush Player ", "url": "http://luludvjo.click", "id": 16 },
    {
      "name": "Warrez",
      "url": "http://gdhrbti5yrhjr6udb45y9nlo4pc945fvv74h4ivde.xn--24-1lcpaew.com",
      "id": 23
    },
    { "name": "Metaplay ", "url": "http://mplay.sytes.net", "id": 26 },
    { "name": "Uniplay ", "url": "http://smalloutlett.com", "id": 31 },
    { "name": "Meta Pro", "url": "http://mpro.sytes.net", "id": 35 },
    { "name": "Applay", "url": "http://ssrv88.com", "id": 37 },
    { "name": "Prime", "url": "http://primes-rz.shop", "id": 38 },
    { "name": "Prime Max", "url": "http://primes-h2.shop", "id": 39 },
    { "name": "Br Pro VIP ", "url": "http://levi25.biz", "id": 40 }
  ],
  "accounts": 1
}
```

Outros endpoints do painel: `api/sport.php`, `api/mhso`, `api/mtx`.
`Constants.second_response_url = mtx() + "mhso"`.

## Player

- **Xtream Codes** via Retrofit: `/player_api.php?` com `username`/`password` e actions
  (`get_live_categories`, `get_live_streams`, `get_vod_categories`, `get_vod_streams`,
  `get_series`, `get_series_categories`, `get_series_info`, `get_vod_info`, `get_short_epg`,
  `get_simple_data_table`), `/xmltv.php`, `?action=...&category_id=*`.
- User-Agent `smart-tv`; Volley com timeout 10 s, 1 retry.
- `bash` fora de escopo do clone: MAC POST, VPN, libhax, chaves TMDB/OpenSubtitles.

## Fluxo pós-portal (captura `-tcpdump` no emulador, HTTP em claro)

Perfil ZEUS → portal `http://futurenethost.online` (79.127.137.144). Sequência:

```
GET /player_api.php?&username=<u>&password=<p>                        -> 200
GET /player_api.php?action=get_live_categories&username=..&password=..
GET /player_api.php?action=get_vod_categories&...
GET /player_api.php?action=get_series_categories&...
GET /live/<user>/<pass>/<stream_id>.ts                                -> 302
     location: http://zlb215.z-cloud.shop/auth/<id>.ts?jwt=<JWT>&id=<id>
GET /player_api.php?action=get_short_epg&...&stream_id=<id>
```

O JWT do redirect é IP-locked (`iss: xui`), payload
`{"exp":…,"iat":…,"ip":"<ip público>","iss":"xui","nbf":…,"username":"<user>"}`.
Host de mídia separado: `zlb215.z-cloud.shop` (177.129.64.82).

## Harness usado (descartável, fora do repo)

Para chamar as JNI fora do app: APK próprio com um `ContentProvider` (sem UI) declarando
`com.andyhax.Crypt$*` e `com.andyhax.crypt.handy` com os mesmos nomes das JNI, mais o
`lib/arm64-v8a/libhax.so` patchado e o payload embutido. Disparo:
`adb shell content query --uri content://com.harness.probe`; saída em `adb logcat -s HARNESS:*`.
