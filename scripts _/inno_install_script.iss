; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Rife Player"
#define MyAppVersion "0.001"
#define MyAppExeName "rifef_.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{FFF84727-B42D-4642-B6EC-8C0465BB9B37}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
; Remove the following line to run in administrative install mode (install for all users.)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputBaseFilename=mysetup
Compression=lzma/fast
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "E:\Users\amade\rifef _\mpv-x86_64\*"; DestDir: "{app}\mpv-x86_64"; Flags: recursesubdirs createallsubdirs
Source: "E:\Users\amade\rifef _\python-3.11.7\*"; DestDir: "{app}\python-3.11.7"; Flags: recursesubdirs createallsubdirs
Source: "E:\Users\amade\rifef _\VSTRT\*"; DestDir: "{app}\VSTRT"; Flags: recursesubdirs createallsubdirs     ;Excludes: "models"
Source: "E:\Users\amade\rifef _\installModels\*"; DestDir: "{app}\VSTRT\models\rife\"; Flags: recursesubdirs createallsubdirs 
Source: "E:\Users\amade\ffmpeg-5.1.1-essentials_build\bin\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\vsmlrt.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\lua\rife_player_bar.lua"; DestDir: "{app}\mpv-x86_64\lua"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\server\express-hls-example\src\server.exe"; DestDir: "{app}\server\"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\server\express-hls-example\src\data.bin"; DestDir: "{app}\server\"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\int.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "F:\all\GitHub\vs-mlrt\scripts _\chrome_extension\extension\RifePlayer\chrome_extension.zip"; DestDir: "{app}\server\"; Flags: ignoreversion
Source: "C:\opencv\opencv\build\x64\vc16\bin\opencv_world480.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\opencv\opencv\build\x64\vc16\bin\opencv_videoio_ffmpeg480_64.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\opencv\opencv\build\x64\vc16\bin\opencv_videoio_msmf480_64.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\opencv\opencv\build\x64\vc16\bin\opencv_videoio_msmf480_64d.dll"; DestDir: "{app}"; Flags: ignoreversion


Source: "C:\Users\amade\source\repos vs\rifef_\x64\Release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

  
[Code]
{ ///////////////////////////////////////////////////////////////////// }
function GetUninstallString(): String;
var
  sUnInstPath: String;
  sUnInstallString: String;
begin
  sUnInstPath := ExpandConstant('Software\Microsoft\Windows\CurrentVersion\Uninstall\{#emit SetupSetting("AppId")}_is1');
  sUnInstallString := '';
  if not RegQueryStringValue(HKLM, sUnInstPath, 'UninstallString', sUnInstallString) then
    RegQueryStringValue(HKCU, sUnInstPath, 'UninstallString', sUnInstallString);
  Result := sUnInstallString;
end;


{ ///////////////////////////////////////////////////////////////////// }
function IsUpgrade(): Boolean;
begin
  Result := (GetUninstallString() <> '');
end;


{ ///////////////////////////////////////////////////////////////////// }
function UnInstallOldVersion(): Integer;
var
  sUnInstallString: String;
  iResultCode: Integer;
begin
{ Return Values: }
{ 1 - uninstall string is empty }
{ 2 - error executing the UnInstallString }
{ 3 - successfully executed the UnInstallString }

  { default return value }
  Result := 0;

  { get the uninstall string of the old app }
  sUnInstallString := GetUninstallString();
  if sUnInstallString <> '' then begin
    sUnInstallString := RemoveQuotes(sUnInstallString);
    if Exec(sUnInstallString, '/SILENT /NORESTART /SUPPRESSMSGBOXES','', SW_HIDE, ewWaitUntilTerminated, iResultCode) then
      Result := 3
    else
      Result := 2;
  end else
    Result := 1;
end;

{ ///////////////////////////////////////////////////////////////////// }
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if (CurStep=ssInstall) then
  begin
    if (IsUpgrade()) then
    begin
      UnInstallOldVersion();
    end;
  end;
end;


[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

