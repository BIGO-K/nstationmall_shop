# THENATURE.SHOP (admin/mobile/pc)
+ 엠몬스타 전체 일정
	https://docs.google.com/spreadsheets/d/1ZNsKeZrZAr2o6DdYGvnWOHJsOPCGyQJgjerCMU5jhUY/edit#gid=425404578
+ 기획 구글드라이브 경로
	https://drive.google.com/drive/u/0/folders/1GdFKU-EjVc__viA00YiX4UBsw1fSl1Vk
+ 디자인 구글드라이브 경로
	https://drive.google.com/drive/u/0/folders/12kDcYpjyskpKdXPBelvy3QH29HWB5mmM
+ 퍼블리싱 작업 리스트
	- admin https://publish.mmonstar.co.kr/thenature/shop_2021/admin/
	- mobile https://publish.mmonstar.co.kr/thenature/shop_2021/mobile/
	- pc https://publish.mmonstar.co.kr/thenature/shop_2021/pc/
<br><br>

## 작업환경
+ vscode에서 작업할 경우 **SFTP** 를 이용하면 FTP에 바로 업로드됩니다.
	- SFTP의 **sftp.json** 파일설정
		```
		"name": "ftp",
		"host": "1.xxx.xx.x2",
		"protocol": "sftp",
		"port": 8023,
		"username": "mmon_publish",
		"password": "비밀번호",
		"remotePath": "/home/mmon_publish/html/thenature/shop_2021/",(실서버)
		"remotePath": "/home/mmon_publish/_merge/html/thenature/shop_2021/",(FTP전달용)
		"remotePath": "/home/mmon_publish/작업자/html/thenature/shop_2021/",(서브 작업자 설정방식)
		"uploadOnSave": true,
		...
		"watcher": {
			"files": "**",
			"autoUpload": false,
			"autoDelete": false
		},
		"ignore": [".vscode", ".git", ".DS_Store"]
		...
		```
	- css, fonts, html, js, scss, image 등 모든 폴더에 watch가 걸려있어 변화가 생기면 자동으로 업로드됩니다.
	- images 폴더는 포토샵에서 save for web을 할 때 파일이 생성되는 시점이 달라 오류 발생할 수 있습니다. (이슈 발생 시 ignore에 추가 테스트 필요)
	- 동기화가 되어 따로 파일을 삭제하지 않아도 됩니다.

- - -
## 작업관련 문서 확인 경로
+ HTML https://github.com/m-monstar/__ui__repository__template/wiki/HTML
+ CSS/SCSS https://github.com/m-monstar/__ui__repository__template/wiki/CSS-SCSS
+ JAVASCRIPT/TYPESCRIPT https://github.com/m-monstar/__ui__repository__template/wiki/JAVASCRIPT---TYPESCRIPT
+ EMAIL TEMPLATE https://github.com/m-monstar/__ui__repository__template/wiki/Email-Template
