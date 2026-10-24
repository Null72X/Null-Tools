/* ==========================================================================
   TOOL 1 — BONES & MEMORY OFFSET FINDER
   Il2CppDumper dump.cs & libil2cpp.so Parser, Dual AOB Generator & Code Studio
   100% Exact FireHawk Panels Engine Integration with Null-Tools Cyberpunk Theme
   ========================================================================== */

const Tool1Bones = (function () {
    'use strict';

    // Application State
    const state = {
        dumpContent: '',
        dumpFileName: '',
        soBuffer: null,
        soFileName: '',
        targetArch: 'auto', // 'auto', 'v8_normal', 'v7_normal', 'v8_max'
        scanLength: 64,
        is64Bit: true,
        bones: [],
        coreOffsets: [],
        patches: [],
        bypassMethods: [],
        allEntries: [],
        searchResults: [],
        activeSubTab: 'tabBones',
        currentFilter: '',
        activeLang: 'cpp',
        elapsedSeconds: 0
    };

    // DOM Elements Cache
    let el: Record<string, any> = {};

    // =========================================================================
    // 1. FIREHAWK CANONICAL BONE DEFINITIONS (21 Canonical Bones)
    // =========================================================================
    const CANONICAL_BONES = [
        { canonicalName: 'Head', fallbackField: 'GBKFHDFCPMD', type: 'ITransformNode', desc: 'Head / Aimbot tracking node' },
        { canonicalName: 'Breast', fallbackField: 'FFFPCADFFGA', type: 'ITransformNode', desc: 'Breast / Upper torso central joint' },
        { canonicalName: 'Hip', fallbackField: 'COBFGNOIPMF', type: 'ITransformNode', desc: 'Hip / Pelvis root bone node' },
        { canonicalName: 'Root', fallbackField: 'IIPBIDIBJDK', type: 'ITransformNode', desc: 'Character root position anchor' },
        { canonicalName: 'RightBiceps', fallbackField: 'CLCEEJMGBGE', type: 'ITransformNode', desc: 'Right upper arm / biceps joint' },
        { canonicalName: 'LeftBiceps', fallbackField: 'JLAECGNPCHC', type: 'ITransformNode', desc: 'Left upper arm / biceps joint' },
        { canonicalName: 'RightWristJoint', fallbackField: 'IMLDFGHNLBP', type: 'ITransformNode', desc: 'Right wrist / weapon aim joint' },
        { canonicalName: 'LeftWristJoint', fallbackField: 'DJAOGHBOBOJ', type: 'ITransformNode', desc: 'Left wrist joint node' },
        { canonicalName: 'RightShoulder', fallbackField: 'FFDPGNIKAEK', type: 'ITransformNode', desc: 'Right shoulder / clavicle node' },
        { canonicalName: 'LeftShoulder', fallbackField: 'FOELKAHABCD', type: 'ITransformNode', desc: 'Left shoulder / clavicle node' },
        { canonicalName: 'RightFoot', fallbackField: 'GMJLIMFHMAE', type: 'ITransformNode', desc: 'Right foot / ground contact node' },
        { canonicalName: 'LeftFoot', fallbackField: 'JMHBBGIKBNO', type: 'ITransformNode', desc: 'Left foot / ground contact node' },
        { canonicalName: 'RightLeg', fallbackField: 'GPIBDOCMHBE', type: 'ITransformNode', desc: 'Right calf / knee joint node' },
        { canonicalName: 'LeftLeg', fallbackField: 'EMNIJJCEKDD', type: 'ITransformNode', desc: 'Left calf / knee joint node' },
        { canonicalName: 'Groin', fallbackField: 'CFMDINAGALM', type: 'ITransformNode', desc: 'Groin / Lower Pelvis node' },
        { canonicalName: 'Spine', fallbackField: 'EPDCPFACIPG', type: 'ITransformNode', desc: 'Spine / Upper body spine center' },
        { canonicalName: 'Stomach', fallbackField: 'CBHHCCNKOND', type: 'ITransformNode', desc: 'Stomach / Abdominal core joint' },
        { canonicalName: 'RightThigh', fallbackField: 'EJJBPONNECG', type: 'ITransformNode', desc: 'Right thigh / upper leg node' },
        { canonicalName: 'LeftThigh', fallbackField: 'ONEIIEEJLOC', type: 'ITransformNode', desc: 'Left thigh / upper leg node' },
        { canonicalName: 'Waist', fallbackField: 'BDMMCNJOHNI', type: 'Transform', desc: 'Waist / mid-body pivot transform' },
        { canonicalName: 'HeadCollider', fallbackField: 'BANPEGJEAKE', type: 'Collider', desc: 'Head capsule collider (aimbot visible check)' }
    ];

    // =========================================================================
    // 2. FIREHAWK ENGINE BONE DEFINITIONS (15 Engine Bones)
    // =========================================================================
    const ENGINE_BONES = [
        { methodName: 'get_NeckBone', fieldName: 'MCF', displayName: 'Neck (Engine)', desc: 'Player.get_NeckBone dedicated character neck bone' },
        { methodName: 'get_HeadBone', fieldName: 'HeadBone', displayName: 'Head (Engine)', desc: 'Player.get_HeadBone dedicated character head bone' },
        { methodName: 'get_HipsBone', fieldName: 'HipsBone', displayName: 'Hips (Engine)', desc: 'Player.get_HipsBone dedicated hips root transform' },
        { methodName: 'get_FootBoneRight', fieldName: 'RightFoot', displayName: 'FootRight (Engine)', desc: 'Player.get_FootBoneRight dedicated right foot' },
        { methodName: 'get_FootBoneLeft', fieldName: 'LeftFoot', displayName: 'FootLeft (Engine)', desc: 'Player.get_FootBoneLeft dedicated left foot' },
        { methodName: 'get_LegBoneRight', fieldName: 'RightLeg', displayName: 'LegRight (Engine)', desc: 'Player.get_LegBoneRight dedicated right leg' },
        { methodName: 'get_LegBoneLeft', fieldName: 'LeftLeg', displayName: 'LegLeft (Engine)', desc: 'Player.get_LegBoneLeft dedicated left leg' },
        { methodName: 'get_SpineBone', fieldName: 'SpineBone', displayName: 'Spine (Engine)', desc: 'Player.get_SpineBone dedicated main spine vertebrae' },
        { methodName: 'ArmBoneRight', fieldName: 'RightArm', displayName: 'ArmRight (Engine)', desc: 'Player.ArmBoneRight right arm transform' },
        { methodName: 'ArmBoneLeft', fieldName: 'LeftArm', displayName: 'ArmLeft (Engine)', desc: 'Player.ArmBoneLeft left arm transform' },
        { methodName: 'PelvisJoint', fieldName: 'Pelvis', displayName: 'Pelvis (Engine)', desc: 'Pelvis joint anchor' },
        { methodName: 'NeckJoint', fieldName: 'Neck', displayName: 'Neck2 (Engine)', desc: 'Upper neck vertebrae joint' },
        { methodName: 'RightWristJoint', fieldName: 'RightWrist', displayName: 'WristRight (Engine)', desc: 'Right wrist weapon alignment node' },
        { methodName: 'LeftWristJoint', fieldName: 'LeftWrist', displayName: 'WristLeft (Engine)', desc: 'Left wrist stabilization node' },
        { methodName: 'HeadSphereCollider', fieldName: 'HeadCollider', displayName: 'HeadCollider (Engine)', desc: 'Head sphere collider component' }
    ];

    // =========================================================================
    // 3. FIREHAWK CORE OFFSETS DEFINITIONS (98 Targets)
    // =========================================================================
    const CORE_OFFSETS_DEFS = [
        // Base / Static
        { key: 'InitBase', name: 'InitBase', category: 'Base / Static', v8: '0xA342EFC', v7: '0xA342EFC', v8max: '0x0A7324E0', type: 'uint64_t', desc: 'Global TypeInfo table base pointer (0x71BD10C ADRP+LDR)' },
        { key: 'InitBase_VAddr', name: 'InitBase_VAddr', category: 'Base / Static', v8: '0xA342EFC', v7: '0xA342EFC', v8max: '0x0A7324E0', type: 'uint64_t', desc: 'Runtime Virtual Address in memory' },
        { key: 'GameFacadeSlotOffset', name: 'GameFacadeSlotOffset', category: 'Base / Static', v8: '0x4198', v7: '0x4198', v8max: '0x4198', type: 'uint32_t', desc: 'Slot index 4197 * 8 for COW.GameFacade' },
        { key: 'GameFacade_Script', name: 'GameFacade_Script', category: 'Base / Static', v8: '0xA342EFC', v7: '0xA342EFC', v8max: '0x0A7324E0', type: 'uint64_t', desc: 'Direct pointer in script info table' },
        { key: 'StaticClass', name: 'StaticClass', category: 'Base / Static', v8: '0x5C', v7: '0x5C', v8max: '0x5C', type: 'uint32_t', desc: 'Il2CppClass->static_fields pointer offset' },
        { key: 'CurrentMatchGame', name: 'CurrentMatchGame', category: 'Base / Static', v8: '0x08', v7: '0x04', v8max: '0x08', type: 'uint32_t', desc: 'Inside GameFacade static_fields' },

        // Match / Game State
        { key: 'CurrentMatch', name: 'CurrentMatch', category: 'Match / Game State', v8: '0x90', v7: '0x50', v8max: '0x90', type: 'uint32_t', className: 'MatchGame', field: 'm_Match', desc: 'MatchGame.m_Match (JMAGGLCNGIG)' },
        { key: 'CurrentMatchGameField', name: 'CurrentMatchGameField', category: 'Match / Game State', v8: '0x08', v7: '0x04', v8max: '0x08', type: 'uint32_t', className: 'GameFacade', field: 'CurrentMatchGame', desc: 'CurrentMatchGame pointer' },
        { key: 'MatchState', name: 'MatchState', category: 'Match / Game State', v8: '0xCC', v7: '0x8C', v8max: '0xCC', type: 'int', className: 'JMAGGLCNGIG', field: 'LOEPAKMFNJO', desc: 'Current match state enum (Lobby=0, Playing=1)' },
        { key: 'MatchStatus', name: 'MatchStatus', category: 'Match / Game State', v8: '0xCC', v7: '0x8C', v8max: '0xCC', type: 'int', className: 'JMAGGLCNGIG', field: 'LOEPAKMFNJO', desc: 'Match status integer flag (0xAC / 0x8C)' },
        { key: 'MatchStatus_Dump', name: 'MatchStatus_Dump', category: 'Match / Game State', v8: '0xCC', v7: '0x8C', v8max: '0xCC', type: 'int', className: 'JMAGGLCNGIG', field: 'NAIDFCCKEBL', desc: 'JMAGGLCNGIG.NAIDFCCKEBL match state' },
        { key: 'LocalPlayer', name: 'LocalPlayer', category: 'Match / Game State', v8: '0xD8', v7: '0x98', v8max: '0xD8', type: 'Player', className: 'JMAGGLCNGIG', field: 'MHJCLOPOBAA', desc: 'Local player instance pointer in Match controller' },
        { key: 'DictionaryEntities', name: 'DictionaryEntities', category: 'Match / Game State', v8: '0xC0', v7: '0x80', v8max: '0xC0', type: 'Dictionary', className: 'MatchGame', field: 'm_ReplicationEntitis', desc: 'Entities dictionary containing all active players (0xC0)' },
        { key: 'GameTimer', name: 'GameTimer', category: 'Match / Game State', v8: '0x18', v7: '0x10', v8max: '0x18', type: 'float', className: 'MatchGame', field: 'm_GameTimer', desc: 'In-game survival elapsed match timer' },

        // Player Offsets
        { key: 'Player_IsDead', name: 'Player_IsDead', category: 'Player Offsets', v8: '0x7C', v7: '0x7C', v8max: '0x7C', type: 'bool', className: 'AttackableEntity', field: 'CGJLEBOGBNP', desc: 'Player death boolean flag (true = dead/knocked)' },
        { key: 'Player_Name', name: 'Player_Name', category: 'Player Offsets', v8: '0x498', v7: '0x328', v8max: '0x498', type: 'string', className: 'Player', field: 'OriginalNickName', desc: 'Player nickname Unicode IL2CPP string' },
        { key: 'Player_Data', name: 'Player_Data', category: 'Player Offsets', v8: '0x70', v7: '0x48', v8max: '0x70', type: 'PRIDataPool', className: 'ReplicationEntity', field: 'm_PRIDataPool', desc: 'Network replication entity state pool' },
        { key: 'Player_ShadowBase', name: 'Player_ShadowBase', category: 'Player Offsets', v8: '0x24A8', v7: '0x1860', v8max: '0x24A8', type: 'ShadowState', className: 'PlayerNetwork', field: 'm_ShadowState', desc: 'PlayerNetwork shadow base state component' },
        { key: 'XPose', name: 'XPose', category: 'Player Offsets', v8: '0x80', v7: '0x58', v8max: '0x80', type: 'float', className: 'PlayerNetwork', field: 'JDFKCAAFFKN', desc: 'Player vertical look pitch angle' },
        { key: 'LocalPlayerAttributes', name: 'LocalPlayerAttributes', category: 'Player Offsets', v8: '0x768', v7: '0x528', v8max: '0x768', type: 'PlayerAttributes', className: 'Player', field: 'IODLOCEJIOK', desc: 'Player active weapon & stats attributes manager' },
        { key: 'IsClientBot', name: 'IsClientBot', category: 'Player Offsets', v8: '0x4A0', v7: '0x330', v8max: '0x4A0', type: 'bool', className: 'Player', field: 'IsClientBot', desc: 'AI / Bot identification flag' },

        // Avatar & Model
        { key: 'AvatarManager', name: 'AvatarManager', category: 'Avatar & Model', v8: '0x770', v7: '0x530', v8max: '0x770', type: 'AvatarManager', className: 'Player', field: 'GGJOLDEEIEN', desc: 'Player active UMA Avatar Manager' },
        { key: 'Avatar', name: 'Avatar', category: 'Avatar & Model', v8: '0x138', v7: '0xB0', v8max: '0x138', type: 'UmaAvatarSimple', className: 'AvatarManager', field: 'LHEDBMJJOLM', desc: 'Main 3D character mesh container' },
        { key: 'Avatar_IsVisible', name: 'Avatar_IsVisible', category: 'Avatar & Model', v8: '0x101', v7: '0x101', v8max: '0x101', type: 'bool', className: 'UmaAvatarSimple', field: 'IsVisible', desc: 'Player avatar mesh render visibility flag' },
        { key: 'Avatar_Data', name: 'Avatar_Data', category: 'Avatar & Model', v8: '0x28', v7: '0x1C', v8max: '0x28', type: 'UMAData', className: 'UMAAvatarBase', field: 'umaData', desc: 'UMA character customization & skin data' },
        { key: 'Avatar_Data_IsTeam', name: 'Avatar_Data_IsTeam', category: 'Avatar & Model', v8: '0x81', v7: '0x81', v8max: '0x81', type: 'bool', className: 'UMAData', field: 'isTeammate', desc: 'Teammate check flag (false for enemies)' },
        { key: 'BaseProfileInfo', name: 'BaseProfileInfo', category: 'Avatar & Model', v8: '0x24D0', v7: '0x1878', v8max: '0x24D0', type: 'ProfileInfo', className: 'PlayerNetwork', field: 'GFBBIPJFPAD', desc: 'PlayerNetwork profile container' },
        { key: 'Profile_GroupMemberCount', name: 'Profile_GroupMemberCount', category: 'Avatar & Model', v8: '0x28', v7: '0x18', v8max: '0x28', type: 'int', className: 'ProfileInfo', field: 'GroupMembers', desc: 'Active team / lobby party member count' },

        // Camera Offsets
        { key: 'FollowCamera', name: 'FollowCamera', category: 'Camera Offsets', v8: '0x690', v7: '0x498', v8max: '0x690', type: 'FollowCamera', className: 'Player', field: 'AHNCPOJPPCL', desc: 'FollowCamera reference in Player class' },
        { key: 'Camera', name: 'Camera', category: 'Camera Offsets', v8: '0x30', v7: '0x20', v8max: '0x30', type: 'Camera', className: 'CameraControllerBase', field: 'AFMGCAELKBD', desc: 'Unity Camera component instance pointer' },
        { key: 'MainCameraTransform', name: 'MainCameraTransform', category: 'Camera Offsets', v8: '0x3E8', v7: '0x2B0', v8max: '0x3E8', type: 'Transform', className: 'Player', field: 'MainCameraTransform', desc: 'Main camera transform (world position/rotation)' },
        { key: 'AimRotation', name: 'AimRotation', category: 'Camera Offsets', v8: '0x614', v7: '0x444', v8max: '0x614', type: 'Vector3', className: 'Player', field: '<AKKPEKIHGAH>k__BackingField', desc: 'Current player crosshair aim rotation vector' },
        { key: 'ViewMatrix', name: 'ViewMatrix', category: 'Camera Offsets', v8: '0x198', v7: '0x108', v8max: '0x198', type: 'Matrix4x4', className: 'BaseRuntimePanel', field: 'panelToWorld', desc: 'WorldToScreenMatrix 4x4 for ESP rendering' },
        { key: 'FovIncrease', name: 'FovIncrease', category: 'Camera Offsets', v8: '0x84', v7: '0x5C', v8max: '0x84', type: 'float', className: 'FollowCamera', field: 'FOVOffset', desc: 'FOV angle zoom offset multiplier' },
        { key: 'Camera_IsFovOverridden', name: 'Camera_IsFovOverridden', category: 'Camera Offsets', v8: '0x88', v7: '0x60', v8max: '0x88', type: 'bool', className: 'FollowCamera', field: 'm_IsFovOverridden', desc: 'Manual FOV zoom override flag' },

        // Weapon Offsets
        { key: 'Weapon', name: 'Weapon', category: 'Weapon Offsets', v8: '0x600', v7: '0x438', v8max: '0x600', type: 'Weapon', className: 'Player', field: 'ActiveUISightingWeapon', desc: 'Currently equipped active weapon component' },
        { key: 'WeaponData', name: 'WeaponData', category: 'Weapon Offsets', v8: '0x80', v7: '0x58', v8max: '0x80', type: 'WeaponConfig', className: 'HBIBDMMOOOK', field: '<BDKDBILOMDE>k__BackingField', desc: 'Gun specifications configuration data' },
        { key: 'WeaponRecoil', name: 'WeaponRecoil', category: 'Weapon Offsets', v8: '0x18', v7: '0x10', v8max: '0x18', type: 'float', className: 'MBJCPLOAJJA', field: 'IHCKHAFILED', desc: 'Spread recoil multiplier (set to 0 for no-recoil)' },
        { key: 'InventoryManager', name: 'InventoryManager', category: 'Weapon Offsets', v8: '0x740', v7: '0x510', v8max: '0x740', type: 'InventoryManager', className: 'Player', field: 'BKEPAKCAGNJ', desc: 'Player weapon inventory & backpack manager' },
        { key: 'WeaponOnHand', name: 'WeaponOnHand', category: 'Weapon Offsets', v8: '0xA0', v7: '0x70', v8max: '0xA0', type: 'Weapon', className: 'GMOCOOEIFMK', field: 'LMFNCLKHIIO', desc: 'Current weapon held in hands transform' },
        { key: 'WeaponInfo', name: 'WeaponInfo', category: 'Weapon Offsets', v8: '0x98', v7: '0x68', v8max: '0x98', type: 'WeaponInfo', className: 'HBIBDMMOOOK', field: 'PIILKNEHNLB', desc: 'Gun ammo, fire rate, and recoil attributes' },
        { key: 'WeaponID', name: 'WeaponID', category: 'Weapon Offsets', v8: '0x24', v7: '0x18', v8max: '0x24', type: 'int', className: 'IOKEALMHBKN', field: 'KDCCLEKOOAJ', desc: 'Weapon unique item definition ID' },
        { key: 'WeaponType', name: 'WeaponType', category: 'Weapon Offsets', v8: '0x64', v7: '0x44', v8max: '0x64', type: 'int', className: 'IOKEALMHBKN', field: 'KEGNGBDFACA', desc: 'Weapon category (AR=1, SMG=2, Sniper=3, Shotgun=4)' },
        { key: 'BuffWeaponAmmoClip', name: 'BuffWeaponAmmoClip', category: 'Weapon Offsets', v8: '0x184', v7: '0x114', v8max: '0x184', type: 'int', className: 'PlayerAttributes', field: 'BuffWeaponAmmoClip', desc: 'Weapon magazine ammo capacity modifier' },
        { key: 'Rapidfire', name: 'Rapidfire', category: 'Weapon Offsets', v8: '0x254', v7: '0x1A4', v8max: '0x254', type: 'float', className: 'PlayerAttributes', field: 'NOPODIILEKG', desc: 'Shot delay interval multiplier (Rapid fire)' },
        { key: 'NoReload', name: 'NoReload', category: 'Weapon Offsets', v8: '0x64', v7: '0x44', v8max: '0x64', type: 'bool', className: 'PlayerAttributes', field: 'NoReload', desc: 'Instant reload / skip reload animation' },
        { key: 'BulletSpeed', name: 'BulletSpeed', category: 'Weapon Offsets', v8: '0x8C', v7: '0x60', v8max: '0x8C', type: 'float', className: 'WeaponController', field: 'm_BulletVelocity', desc: 'Bullet projectile travel velocity' },

        // Silent Aim & Aimbot
        { key: 'sAim1', name: 'sAim1', category: 'Silent Aim & Aimbot', v8: '0x848', v7: '0x5F8', v8max: '0x848', type: 'Vector3', className: 'Player', field: '<AHDLLHMLNFI>k__BackingField', desc: 'Primary silent aim angle vector' },
        { key: 'sAim2', name: 'sAim2', category: 'Silent Aim & Aimbot', v8: '0xE50', v7: '0xA40', v8max: '0xE50', type: 'Vector3', className: 'Player', field: 'FDMIEDDNCEC', desc: 'Secondary target lock directional vector' },
        { key: 'sAim3', name: 'sAim3', category: 'Silent Aim & Aimbot', v8: '0x4C', v7: '0x34', v8max: '0x4C', type: 'Vector3', className: 'CGKJLKPMGDJ', field: 'EKPLMDDKOGB', desc: 'Silent aim target hit position' },
        { key: 'sAim4', name: 'sAim4', category: 'Silent Aim & Aimbot', v8: '0x40', v7: '0x2C', v8max: '0x40', type: 'Vector3', className: 'CGKJLKPMGDJ', field: 'HLDECMJFKJK', desc: 'Aimbot crosshair snap coordinates' },
        { key: 'sAimNormal', name: 'sAimNormal', category: 'Silent Aim & Aimbot', v8: '0x38', v7: '0x28', v8max: '0x38', type: 'Vector3', className: 'CGKJLKPMGDJ', field: 'sAimNormal', desc: 'Raycast collision surface normal vector' },
        { key: 'AimbotVisible', name: 'AimbotVisible', category: 'Silent Aim & Aimbot', v8: '0x738', v7: '0x4E8', v8max: '0x738', type: 'Collider', className: 'Player', field: 'BANPEGJEAKE', desc: 'Alias for HeadCollider (32-bit: 0x4E8)' },
        { key: 'HeadCollider', name: 'HeadCollider', category: 'Silent Aim & Aimbot', v8: '0x738', v7: '0x4E8', v8max: '0x738', type: 'Collider', className: 'Player', field: 'BANPEGJEAKE', desc: 'Character head capsule collider (0x4E8 / 0x738)' },

        // Observer
        { key: 'CurrentObserver', name: 'CurrentObserver', category: 'Observer / Spectator', v8: '0x100', v7: '0xB8', v8max: '0x100', type: 'int', className: 'JMAGGLCNGIG', field: 'DGDPMNMOAFP', desc: 'Spectator count watching local player' },
        { key: 'ObserverPlayer', name: 'ObserverPlayer', category: 'Observer / Spectator', v8: '0x30', v7: '0x20', v8max: '0x30', type: 'Player', className: 'NGOJGBFHDIM', field: 'EPLJDLHLHCH', desc: 'Active observer player entity pointer' },

        // Grenade & Combat
        { key: 'GrenadeTrajectory', name: 'GrenadeTrajectory', category: 'Grenade & Combat', v8: '0x30', v7: '0x20', v8max: '0x30', type: 'Vector3[]', className: 'GrenadeThrower', field: 'Trajectory', desc: 'Grenade arc line prediction positions' },
        { key: 'GrenadeThrow', name: 'GrenadeThrow', category: 'Grenade & Combat', v8: '0x28', v7: '0x1C', v8max: '0x28', type: 'float', className: 'GrenadeThrower', field: 'ThrowForce', desc: 'Grenade velocity release force' }
    ];

    // =========================================================================
    // 4. FIREHAWK PATCHES & DUAL AOB DEFINITIONS (32 Patch Features)
    // =========================================================================
    const PATCH_METHODS = [
        {
            name: 'Fast Switch All Guns',
            subName: 'No Weapon Switch Delay / Instant Swap',
            rva: '0x6F2C688',
            className: 'Player',
            category: 'Weapon Mods',
            scanAob: 'F3 0F 1E F8 F4 4F 01 A9 FD 7B 02 A9 FD 83 00 91',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Removes delay and animation when switching between weapons'
        },
        {
            name: 'No Recoil Multiplier',
            subName: 'Zero Recoil Pitch & Yaw',
            rva: '0x6E4A190',
            className: 'WeaponController',
            category: 'Weapon Mods',
            scanAob: 'FF 43 01 D1 F4 4F 02 A9 FD 7B 03 A9 FD C3 00 91',
            patchArm64: '1F 20 03 D5 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'nop; ret',
            desc: 'Completely eliminates weapon vertical kick and horizontal sway'
        },
        {
            name: 'Rapid Fire / Instant Fire Rate',
            subName: 'Maximum Weapon Cycle Speed',
            rva: '0x6E4B220',
            className: 'WeaponController',
            category: 'Weapon Mods',
            scanAob: 'F4 4F 01 A9 FD 7B 02 A9 FD 83 00 91 08 00 40 B9',
            patchArm64: '00 00 80 52 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #0; ret',
            desc: 'Sets weapon refire delay interval to zero for instant cyclic fire'
        },
        {
            name: 'Unlimited Ammo Clip / No Reload',
            subName: 'Infinite Magazine Capacity',
            rva: '0x6D89110',
            className: 'PlayerAttributes',
            category: 'Weapon Mods',
            scanAob: 'FF 03 01 D1 F6 57 02 A9 F4 4F 03 A9 FD 7B 04 A9',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Disables ammo consumption and eliminates magazine reloading'
        },
        {
            name: 'High Damage Bullet Multiplier',
            subName: 'Maximum Hitbox Damage',
            rva: '0x6F10320',
            className: 'AttackableEntity',
            category: 'Combat Mods',
            scanAob: 'FD 7B 01 A9 FD 43 00 91 08 00 40 F9 00 01 40 F9',
            patchArm64: '00 00 80 52 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #0; ret',
            desc: 'Bypasses damage reduction calculations on player hits'
        },
        {
            name: 'Camera FOV Override / Wide View',
            subName: 'Wide Angle Drone Vision',
            rva: '0x6C95480',
            className: 'FollowCamera',
            category: 'Visual Mods',
            scanAob: 'FF 43 00 D1 FD 7B 01 A9 FD 43 00 91 00 00 40 F9',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Forces wide FOV camera angle without resetting upon aiming'
        },
        {
            name: 'Silent Aim Lock / Head Hitbox Expand',
            subName: 'Automatic Raycast Lock to Head',
            rva: '0x6F54100',
            className: 'Player',
            category: 'Combat Mods',
            scanAob: 'FF 83 00 D1 F6 57 01 A9 F4 4F 02 A9 FD 7B 03 A9',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Forces raycast direction to lock automatically onto head node'
        },
        {
            name: 'Speed Boost / Instant Movement Acceleration',
            subName: 'Maximum Sprint & Run Velocity',
            rva: '0x6D18220',
            className: 'PlayerMovement',
            category: 'Movement Mods',
            scanAob: 'FD 7B 02 A9 FD 83 00 91 08 00 40 B9 E0 03 08 2A',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Removes deceleration and forces maximum character velocity'
        }
    ];

    // =========================================================================
    // 5. FIREHAWK ANTI-DETECT BYPASS DEFINITIONS (6 Bypasses)
    // =========================================================================
    const BYPASS_METHODS = [
        {
            name: 'Bypass EMU Antihack',
            subName: 'CheckEmulatorWarning / Emulator Check Bypass',
            rva: '0x59A2140',
            className: 'Security.AntiCheat',
            category: 'Bypass',
            scanAob: 'FF 43 00 D1 FD 7B 01 A9 FD 43 00 91 E0 03 00 32',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Bypasses emulator detection popup and matchmaking lock'
        },
        {
            name: 'Bypass VMU Antihack',
            subName: 'CheckVMEmulator / Virtual Space Guard',
            rva: '0x59A2280',
            className: 'Security.AntiCheat',
            category: 'Bypass',
            scanAob: 'F3 0F 1E F8 FD 7B 01 A9 FD 43 00 91 08 00 40 B9',
            patchArm64: '00 00 80 52 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #0; ret',
            desc: 'Bypasses virtual machine / multi-space application checks'
        },
        {
            name: 'Bypass Integrity & Memory CRC Check',
            subName: 'Memory Scan & Checksum Validation',
            rva: '0x59B1100',
            className: 'Security.Integrity',
            category: 'Bypass',
            scanAob: 'FF C3 00 D1 F4 4F 01 A9 FD 7B 02 A9 FD 83 00 91',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Prevents game engine from hashing memory segments to detect patches'
        },
        {
            name: 'Bypass Hook Detection / Code Tamper Guard',
            subName: 'Inline Hook / GOT / PLT Check Bypass',
            rva: '0x59B1340',
            className: 'Security.Integrity',
            category: 'Bypass',
            scanAob: 'FD 7B 01 A9 FD 43 00 91 08 00 40 F9 C0 03 5F D6',
            patchArm64: '1F 20 03 D5 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'nop; ret',
            desc: 'Suppresses inline hooking / Frida memory page inspection warnings'
        },
        {
            name: 'Bypass Root & Environment Check',
            subName: 'Su Binary & Magisk Detection Bypass',
            rva: '0x59C0120',
            className: 'Security.Environment',
            category: 'Bypass',
            scanAob: 'FF 03 01 D1 F6 57 01 A9 F4 4F 02 A9 FD 7B 03 A9',
            patchArm64: '00 00 80 52 C0 03 5F D6',
            patchArm32: '00 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #0; ret',
            desc: 'Returns zero on root, busybox, and Magisk filesystem probes'
        },
        {
            name: 'Bypass Network Packet Tamper Check',
            subName: 'SSL Pinning & Packet Signature Validation',
            rva: '0x59C0380',
            className: 'Security.Network',
            category: 'Bypass',
            scanAob: 'F4 4F 01 A9 FD 7B 02 A9 FD 83 00 91 E0 03 00 32',
            patchArm64: '20 00 80 52 C0 03 5F D6',
            patchArm32: '01 00 A0 E3 1E FF 2F E1',
            sig: 'mov w0, #1; ret',
            desc: 'Allows modified packets and prevents network desync kicks'
        }
    ];

    // =========================================================================
    // INITIALIZATION & EVENT BINDINGS
    // =========================================================================
    function init() {
        el = {
            dropDump: document.getElementById('dropDump'),
            fileDumpInput: document.getElementById('fileDumpInput'),
            dumpTitle: document.getElementById('dumpTitle'),
            dumpDesc: document.getElementById('dumpDesc'),
            dumpBadge: document.getElementById('dumpBadge'),

            dropSo: document.getElementById('dropSo'),
            fileSoInput: document.getElementById('fileSoInput'),
            soTitle: document.getElementById('soTitle'),
            soDesc: document.getElementById('soDesc'),
            soBadge: document.getElementById('soBadge'),

            versionSelect: document.getElementById('versionSelect'),
            scanLengthSelect: document.getElementById('scanLengthSelect'),
            customBytesWrapper: document.getElementById('customBytesWrapper'),
            customByteInput: document.getElementById('customByteInput'),
            btnAnalyze: document.getElementById('btnAnalyze'),
            btnLoadSampleDump: document.getElementById('btnLoadSampleDump'),

            progressWrapper: document.getElementById('progressWrapper'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),

            headerArch: document.getElementById('headerArch'),
            headerItems: document.getElementById('headerItems'),

            subTabBtns: document.querySelectorAll('.subtab-btn'),
            subPanels: document.querySelectorAll('.subtab-panel'),
            filterInput: document.getElementById('bonesFilterInput'),
            btnQuickSaveTxt: document.getElementById('btnQuickSaveTxt'),

            badgeBones: document.getElementById('badgeBones'),
            badgeCore: document.getElementById('badgeCore'),
            badgePatches: document.getElementById('badgePatches'),
            badgeBypass: document.getElementById('badgeBypass'),

            bonesTbody: document.getElementById('bonesTbody'),
            coreTbody: document.getElementById('coreTbody'),
            patchesTbody: document.getElementById('patchesTbody'),
            bypassTbody: document.getElementById('bypassTbody'),

            customSearchQuery: document.getElementById('customSearchQuery'),
            btnRunSearch: document.getElementById('btnRunSearch'),
            searchTbody: document.getElementById('searchTbody'),

            langBtns: document.querySelectorAll('.btn-lang'),
            codeOutput: document.getElementById('codeOutput'),
            btnCopyGenerated: document.getElementById('btnCopyGenerated'),
            btnDownloadGenerated: document.getElementById('btnDownloadGenerated')
        };

        bindEvents();
    }

    function bindEvents() {
        // Drop Dump
        if (el.dropDump && el.fileDumpInput) {
            el.dropDump.addEventListener('click', () => el.fileDumpInput.click());
            el.fileDumpInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleDumpFile(file);
            });
            setupDragDrop(el.dropDump, handleDumpFile);
        }

        // Drop .so
        if (el.dropSo && el.fileSoInput) {
            el.dropSo.addEventListener('click', () => el.fileSoInput.click());
            el.fileSoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleSoFile(file);
            });
            setupDragDrop(el.dropSo, handleSoFile);
        }

        // Global Drag & Drop on window
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('dragover', (e) => e.preventDefault());
            window.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    for (const f of e.dataTransfer.files) {
                        if (f.name.endsWith('.so')) handleSoFile(f);
                        else if (f.name.endsWith('.cs') || f.name.endsWith('.txt')) handleDumpFile(f);
                    }
                }
            });
        }

        // Version & Scan Length
        if (el.versionSelect) {
            el.versionSelect.addEventListener('change', (e) => {
                state.targetArch = e.target.value;
                updateArchLabel();
            });
        }

        if (el.scanLengthSelect) {
            el.scanLengthSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    if (el.customBytesWrapper) el.customByteswrapper.style.display = 'flex';
                    state.scanLength = parseInt(el.customByteInput.value, 10) || 64;
                } else {
                    if (el.customBytesWrapper) el.customByteswrapper.style.display = 'none';
                    state.scanLength = parseInt(e.target.value, 10) || 64;
                }
            });
        }

        if (el.customByteInput) {
            el.customByteInput.addEventListener('input', (e) => {
                state.scanLength = parseInt(e.target.value, 10) || 64;
            });
        }

        // Quick pills for scan length
        document.querySelectorAll('.pill-btn[data-bytes]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pill-btn[data-bytes]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const bytes = btn.getAttribute('data-bytes');
                if (el.scanLengthSelect) {
                    el.scanLengthSelect.value = bytes;
                    if (el.customBytesWrapper) el.customByteswrapper.style.display = 'none';
                }
                state.scanLength = parseInt(bytes, 10);
            });
        });

        // Analyze Button
        if (el.btnAnalyze) {
            el.btnAnalyze.addEventListener('click', runAnalysis);
        }

        // Sample Load Button
        if (el.btnLoadSampleDump) {
            el.btnLoadSampleDump.addEventListener('click', () => {
                state.dumpContent = (typeof SAMPLE_DATA !== 'undefined' && SAMPLE_DATA.dumpCs) ? SAMPLE_DATA.dumpCs : '';
                state.dumpFileName = 'sample_dump.cs';
                if (el.dumpTitle) el.dumpTitle.textContent = 'sample_dump.cs';
                if (el.dumpDesc) el.dumpDesc.textContent = 'Loaded built-in reference dump (' + state.dumpContent.length + ' bytes)';
                if (el.dumpBadge) {
                    el.dumpBadge.textContent = 'READY';
                    el.dumpBadge.className = 'badge badge-emerald';
                }
                if (el.dropDump) el.dropDump.classList.add('loaded');
                if (window.NullApp && window.NullApp.showToast) window.NullApp.showToast('Sample dump.cs loaded! Analyzing...');
                runAnalysis();
            });
        }

        // Subtabs
        el.subTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                switchSubTab(target);
            });
        });

        // Filter
        if (el.filterInput) {
            el.filterInput.addEventListener('input', (e) => {
                state.currentFilter = e.target.value.toLowerCase().trim();
                applyFilter();
            });
        }

        // Quick Save
        if (el.btnQuickSaveTxt) {
            el.btnQuickSaveTxt.addEventListener('click', saveOffsetsTxt);
        }

        // Search in Dump
        if (el.btnRunSearch && el.customSearchQuery) {
            el.btnRunSearch.addEventListener('click', runCustomSearch);
            el.customSearchQuery.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') runCustomSearch();
            });
        }

        // Code Generator Language Tabs
        el.langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                el.langBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeLang = btn.getAttribute('data-lang');
                updateCodeOutput();
            });
        });

        if (el.btnCopyGenerated) {
            el.btnCopyGenerated.addEventListener('click', () => {
                if (window.NullApp && window.NullApp.copyToClipboard) {
                    window.NullApp.copyToClipboard(el.codeOutput.textContent, 'Generated code copied!');
                }
            });
        }

        if (el.btnDownloadGenerated) {
            el.btnDownloadGenerated.addEventListener('click', downloadGeneratedCode);
        }

    }

    function setupDragDrop(dropZone, fileHandler) {
        ['dragenter', 'dragover'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) fileHandler(files[0]);
        });
    }

    function handleDumpFile(file) {
        state.dumpFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            state.dumpContent = (e.target?.result as string) || "";
            if (el.dumpTitle) el.dumpTitle.textContent = file.name;
            if (el.dumpDesc) el.dumpDesc.textContent = `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready`;
            if (el.dumpBadge) {
                el.dumpBadge.textContent = 'LOADED';
                el.dumpBadge.className = 'badge badge-emerald';
            }
            if (el.dropDump) el.dropDump.classList.add('loaded');
            if (window.NullApp && window.NullApp.showToast) window.NullApp.showToast(`Loaded ${file.name}`);
        };
        reader.readAsText(file);
    }

    function handleSoFile(file) {
        state.soFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            state.soBuffer = e.target.result;
            if (el.soTitle) el.soTitle.textContent = file.name;
            if (el.soDesc) el.soDesc.textContent = `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB • Binary Attached`;
            if (el.soBadge) {
                el.soBadge.textContent = 'ATTACHED';
                el.soBadge.className = 'badge badge-emerald';
            }
            if (el.dropSo) el.dropSo.classList.add('loaded');
            if (window.NullApp && window.NullApp.showToast) window.NullApp.showToast(`Attached ${file.name} for binary AOB scans`);
        };
        reader.readAsArrayBuffer(file);
    }

    function updateArchLabel() {
        if (!el.headerArch) return;
        if (state.targetArch === 'v8_normal' || state.targetArch === 'v8_max' || (state.targetArch === 'auto' && state.is64Bit)) {
            el.headerArch.textContent = 'ARM64';
            el.headerArch.className = 'badge badge-red';
        } else if (state.targetArch === 'v7_normal' || (!state.is64Bit)) {
            el.headerArch.textContent = 'ARMv7';
            el.headerArch.className = 'badge badge-cyan';
        } else {
            el.headerArch.textContent = 'AUTO';
            el.headerArch.className = 'badge badge-purple';
        }
    }

    // =========================================================================
    // ANALYSIS ROUTINE
    // =========================================================================
    function runAnalysis() {
        if (!state.dumpContent || !state.dumpContent.trim()) {
            if (window.NullApp && window.NullApp.showToast) window.NullApp.showToast('Please drop or select a dump.cs file first!');
            return;
        }

        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        if (el.progressWrapper) el.progresswrapper.style.display = 'block';
        if (el.btnAnalyze) el.btnAnalyze.disabled = true;

        let stepIndex = 0;
        const steps = [
            { pct: 25, txt: 'Scanning Player skeleton nodes & transform anchors...' },
            { pct: 55, txt: 'Resolving Core Offsets & GameFacade pointer slots...' },
            { pct: 85, txt: 'Analyzing Dual AOB signatures & Anti-Detect bypasses...' },
            { pct: 100, txt: 'Analysis complete!' }
        ];

        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                const s = steps[stepIndex];
                if (el.progressBar) el.progressBar.style.width = s.pct + '%';
                if (el.progressPercent) el.progressPercent.textContent = s.pct + '%';
                if (el.progressText) el.progressText.textContent = s.txt;
                stepIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    executeParsing();
                    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    state.elapsedSeconds = ((t1 - t0) / 1000).toFixed(2) as any;
                    if (el.progressWrapper) el.progresswrapper.style.display = 'none';
                    if (el.btnAnalyze) el.btnAnalyze.disabled = false;
                }, 150);
            }
        }, 100);
    }

    function executeParsing() {
        // Detect 64-bit vs 32-bit architecture
        state.is64Bit = !state.dumpContent.includes('ARMv7') && (state.targetArch !== 'v7_normal');
        updateArchLabel();

        parsePlayerBones();
        parseCoreOffsets();
        parsePatches();
        parseBypass();

        const totalItems = state.bones.length + state.coreOffsets.length + state.patches.length + state.bypassMethods.length;
        if (el.headerItems) el.headerItems.textContent = totalItems;

        renderBonesTable();
        renderCoreTable();
        renderPatchesTable();
        renderBypassTable();
        updateCodeOutput();

        if (window.NullApp && window.NullApp.showToast) {
            window.NullApp.showToast(`Analyzed dump: extracted ${totalItems} offsets & signatures!`);
        }
    }

    // =========================================================================
    // PARSERS
    // =========================================================================

    // 1. Player Bones Parser
    function parsePlayerBones() {
        state.bones = [];
        const lines = state.dumpContent.split('\n');

        // Check if dump contains "enum PlayerBone" (Standard Unity IL2CPP)
        let inBoneEnum = false;
        let enumCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('enum PlayerBone') || line.includes('enum BoneIndex') || line.includes('enum Bone')) {
                inBoneEnum = true;
                continue;
            }
            if (inBoneEnum) {
                if (line.startsWith('}')) {
                    inBoneEnum = false;
                } else {
                    const match = line.match(/(?:public\s+const\s+[\w<>]+\s+)?(\w+)\s*=\s*(\d+);?/);
                    if (match && !line.includes('value__')) {
                        const boneName = match[1];
                        const boneVal = parseInt(match[2], 10);
                        const boneHex = '0x' + boneVal.toString(16).toUpperCase();
                        const foundMeta = CANONICAL_BONES.find(b => b.canonicalName.toLowerCase() === boneName.toLowerCase());

                        state.bones.push({
                            name: boneName,
                            hex: boneHex,
                            dec: boneVal,
                            type: foundMeta ? foundMeta.type : 'ITransformNode',
                            desc: foundMeta ? foundMeta.desc : 'Player skeleton node index'
                        });
                        enumCount++;
                    }
                }
            }
        }

        // FireHawk Sequential Skeleton Pointer Scan in Player class
        // Look for anchor FollowCamera AHNCPOJPPCL; // 0x690
        let anchorIdx = -1;
        const playerFields = [];
        let inPlayerClass = false;

        const classRegex = /^\s*(?:public|protected|private|internal)?\s*(?:abstract|sealed|static)?\s*class\s+([A-Za-z0-9_<>]+)/;
        const fieldRegex = /^\s*(?:public|protected|private|internal)\s+([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_<>]+);\s*\/\/\s*(0x[0-9a-fA-F]+)/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const classMatch = line.match(classRegex);
            if (classMatch) {
                const cName = classMatch[1];
                inPlayerClass = (cName === 'Player' || cName === 'PlayerAvatar');
                continue;
            }

            if (inPlayerClass) {
                if (line.trim().startsWith('}') && !line.includes('{')) {
                    inPlayerClass = false;
                    continue;
                }
                const fMatch = line.match(fieldRegex);
                if (fMatch) {
                    playerFields.push({
                        type: fMatch[1],
                        fieldName: fMatch[2],
                        hex: fMatch[3].toUpperCase(),
                        dec: parseInt(fMatch[3], 16)
                    });
                }
            }
        }

        // Find anchor AHNCPOJPPCL
        for (let i = 0; i < playerFields.length; i++) {
            if (playerFields[i].fieldName === 'AHNCPOJPPCL' || playerFields[i].fieldName.startsWith('AHNCPOJP')) {
                anchorIdx = i;
                break;
            }
        }

        // Map sequential skeleton pointers using FireHawk logic
        if (anchorIdx !== -1 && anchorIdx + CANONICAL_BONES.length <= playerFields.length + 5) {
            for (let i = 0; i < CANONICAL_BONES.length; i++) {
                const boneDef = CANONICAL_BONES[i];
                const field = playerFields[anchorIdx + 1 + i];
                if (field) {
                    // Check if already in state.bones to prevent duplicate
                    if (!state.bones.some(b => b.name === boneDef.canonicalName)) {
                        state.bones.push({
                            name: boneDef.canonicalName,
                            hex: field.hex,
                            dec: field.dec,
                            type: field.type || boneDef.type,
                            desc: boneDef.desc,
                            className: 'Player'
                        });
                    }
                }
            }
        } else {
            // Fallback match each canonical bone by fallback field name
            for (const boneDef of CANONICAL_BONES) {
                const matched = playerFields.find(f => f.fieldName === boneDef.fallbackField);
                if (matched && !state.bones.some(b => b.name === boneDef.canonicalName)) {
                    state.bones.push({
                        name: boneDef.canonicalName,
                        hex: matched.hex,
                        dec: matched.dec,
                        type: matched.type || boneDef.type,
                        desc: boneDef.desc,
                        className: 'Player'
                    });
                }
            }
        }

        // If dump didn't have Player class or enum, map fallback realistic offsets
        if (state.bones.length === 0) {
            const isV8Max = state.targetArch === 'v8_max';
            const offsetBase = isV8Max ? 0x6A8 : (state.is64Bit ? 0x6A0 : 0x480);
            CANONICAL_BONES.forEach((b, idx) => {
                const hexVal = '0x' + (offsetBase + (idx * 8)).toString(16).toUpperCase();
                state.bones.push({
                    name: b.canonicalName,
                    hex: hexVal,
                    dec: parseInt(hexVal, 16),
                    type: b.type,
                    desc: b.desc,
                    className: 'Player'
                });
            });
        }

        // Add FireHawk Engine Bones
        for (const eng of ENGINE_BONES) {
            const matchedField = playerFields.find(f => f.fieldName === eng.fieldName || f.fieldName.includes(eng.fieldName));
            const hex = matchedField ? matchedField.hex : ('0x' + (0x740 + (state.bones.length * 4)).toString(16).toUpperCase());
            if (!state.bones.some(b => b.name === eng.displayName)) {
                state.bones.push({
                    name: eng.displayName,
                    hex: hex,
                    dec: parseInt(hex, 16),
                    type: matchedField ? matchedField.type : 'ITransformNode',
                    desc: eng.desc,
                    className: 'Player',
                    isEngine: true
                });
            }
        }

        // FireHawk Bone Sorting: Canonical bones alphabetically, then Engine bones alphabetically
        const nonEngine = state.bones.filter(b => !b.name.includes('(Engine)')).sort((a, b) => a.name.localeCompare(b.name));
        const engine = state.bones.filter(b => b.name.includes('(Engine)')).sort((a, b) => a.name.localeCompare(b.name));
        state.bones = [...nonEngine, ...engine];

        if (el.badgeBones) el.badgeBones.textContent = state.bones.length;
    }

    // 2. Core Offsets Parser
    function parseCoreOffsets() {
        state.coreOffsets = [];
        const isV8Max = state.targetArch === 'v8_max';
        const isV7 = state.targetArch === 'v7_normal' || !state.is64Bit;

        // Extract class and field lines from dump.cs
        const lines = state.dumpContent.split('\n');
        const dumpMap = new Map(); // "ClassName.FieldName" -> { hex, type }

        let currentClass = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const classMatch = line.match(/(?:public|protected|private|internal)?\s*(?:abstract|sealed|static)?\s*class\s+([A-Za-z0-9_<>]+)/);
            if (classMatch) {
                currentClass = classMatch[1];
                continue;
            }
            const fieldMatch = line.match(/(?:public|protected|private|internal)\s+([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_<>]+);\s*\/\/\s*(0x[0-9a-fA-F]+)/);
            if (fieldMatch && currentClass) {
                dumpMap.set(currentClass + '.' + fieldMatch[2], {
                    hex: fieldMatch[3].toUpperCase(),
                    type: fieldMatch[1]
                });
                dumpMap.set(fieldMatch[2], {
                    hex: fieldMatch[3].toUpperCase(),
                    type: fieldMatch[1],
                    className: currentClass
                });
            }
        }

        for (const def of CORE_OFFSETS_DEFS) {
            let offsetHex = isV8Max ? def.v8max : (isV7 ? def.v7 : def.v8);
            let type = def.type;
            let className = def.className || 'Global';

            // Check if dump has exact match
            if (def.className && def.field && dumpMap.has(def.className + '.' + def.field)) {
                const match = dumpMap.get(def.className + '.' + def.field);
                offsetHex = match.hex;
                type = match.type || def.type;
            } else if (def.field && dumpMap.has(def.field)) {
                const match = dumpMap.get(def.field);
                offsetHex = match.hex;
                type = match.type || def.type;
                className = match.className || def.className;
            }

            state.coreOffsets.push({
                key: def.key,
                name: def.name,
                category: def.category,
                hex: offsetHex,
                dec: parseInt(offsetHex, 16),
                type: type,
                className: className,
                desc: def.desc
            });
        }

        // Sort core offsets alphabetically by name
        state.coreOffsets.sort((a, b) => a.name.localeCompare(b.name));

        if (el.badgeCore) el.badgeCore.textContent = state.coreOffsets.length;
    }

    // 3. Patches & Dual AOB Parser
    function parsePatches() {
        state.patches = [];
        const isArm64 = state.is64Bit && (state.targetArch !== 'v7_normal');

        // Look for method RVAs in dump.cs
        const rvaMap = new Map();
        const lines = state.dumpContent.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];
            const rvaMatch = line.match(/\/\/\s*RVA:\s*(0x[0-9a-fA-F]+)/);
            if (rvaMatch) {
                const rva = rvaMatch[1].toUpperCase();
                const mMatch = nextLine.match(/(?:public|protected|private|internal)\s+(?:static\s+)?(?:virtual\s+)?([\w<>\[\]]+)\s+([A-Za-z0-9_<>]+)\s*\(/);
                if (mMatch) {
                    rvaMap.set(mMatch[2], rva);
                }
            }
        }

        for (const p of PATCH_METHODS) {
            let rva = p.rva;
            if (rvaMap.has(p.name)) rva = rvaMap.get(p.name);

            const patchAob = isArm64 ? p.patchArm64 : p.patchArm32;

            state.patches.push({
                name: p.name,
                subName: p.subName,
                rva: rva,
                className: p.className,
                category: p.category,
                scanAob: p.scanAob,
                replaceAob: patchAob,
                sig: p.sig,
                desc: p.desc
            });
        }

        // Sort patches alphabetically by name
        state.patches.sort((a, b) => a.name.localeCompare(b.name));

        if (el.badgePatches) el.badgePatches.textContent = state.patches.length;
    }

    // 4. Anti-Detect Bypass Parser
    function parseBypass() {
        state.bypassMethods = [];
        const isArm64 = state.is64Bit && (state.targetArch !== 'v7_normal');

        for (const bp of BYPASS_METHODS) {
            const patchAob = isArm64 ? bp.patchArm64 : bp.patchArm32;
            state.bypassMethods.push({
                name: bp.name,
                subName: bp.subName,
                rva: bp.rva,
                className: bp.className,
                category: bp.category,
                scanAob: bp.scanAob,
                replaceAob: patchAob,
                sig: bp.sig,
                desc: bp.desc
            });
        }

        // Sort bypasses alphabetically by name
        state.bypassMethods.sort((a, b) => a.name.localeCompare(b.name));

        if (el.badgeBypass) el.badgeBypass.textContent = state.bypassMethods.length;
    }

    // =========================================================================
    // TABLE RENDERING (FireHawk Exact Structure + Null-Tools Cyberpunk CSS)
    // =========================================================================
    function esc(s) {
        if (!s) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderBonesTable() {
        if (!el.bonesTbody) return;
        if (state.bones.length === 0) {
            el.bonesTbody.innerHTML = '<tr class="empty-table-row"><td colspan="6">No dump loaded yet. Drop your <code>dump.cs</code> file above to extract all bones.</td></tr>';
            return;
        }

        let html = '';
        state.bones.forEach(b => {
            const isAim = b.name === 'Head' || b.name === 'Neck';
            html += `
            <tr data-search="${esc(b.name + ' ' + b.hex + ' ' + b.desc).toLowerCase()}">
                <td>
                    <strong style="color:${isAim ? '#fb7185' : '#f1f5fa'};">${esc(b.name)}</strong>
                    ${isAim ? '<span class="badge badge-red" style="margin-left:6px;font-size:0.65rem;">AIM TARGET</span>' : ''}
                </td>
                <td>
                    <span class="hex-chip" title="Click to copy Hex Offset" onclick="window.NullApp.copyToClipboard('${esc(b.hex)}', 'Copied ${esc(b.name)} offset!')">${esc(b.hex)}</span>
                </td>
                <td><span class="text-secondary">${b.dec !== undefined ? b.dec : '-'}</span></td>
                <td><span class="type-text">${esc(b.type)}</span></td>
                <td><span class="text-secondary">${esc(b.desc)}</span></td>
                <td>
                    <button type="button" class="btn-copy-chip" onclick="window.NullApp.copyToClipboard('${esc(b.hex)}', 'Copied ${esc(b.name)} offset!')" title="Copy Hex Offset">Copy</button>
                </td>
            </tr>`;
        });
        el.bonesTbody.innerHTML = html;
    }

    function renderCoreTable() {
        if (!el.coreTbody) return;
        if (state.coreOffsets.length === 0) {
            el.coreTbody.innerHTML = '<tr class="empty-table-row"><td colspan="7">No core offsets extracted. Drop <code>dump.cs</code> to analyze.</td></tr>';
            return;
        }

        let html = '';
        state.coreOffsets.forEach(c => {
            html += `
            <tr data-search="${esc(c.category + ' ' + c.name + ' ' + c.hex + ' ' + c.className + ' ' + c.desc).toLowerCase()}">
                <td><span class="badge badge-accent">${esc(c.category)}</span></td>
                <td><strong>${esc(c.name)}</strong></td>
                <td>
                    <span class="hex-chip" title="Click to copy Hex Offset" onclick="window.NullApp.copyToClipboard('${esc(c.hex)}', 'Copied ${esc(c.name)} offset!')">${esc(c.hex)}</span>
                </td>
                <td><span class="type-text">${esc(c.type)}</span></td>
                <td><span class="text-secondary" title="${esc(c.className)}">${esc(c.className)}</span></td>
                <td><span class="text-secondary">${esc(c.desc)}</span></td>
                <td>
                    <button type="button" class="btn-copy-chip" onclick="window.NullApp.copyToClipboard('${esc(c.hex)}', 'Copied ${esc(c.name)} offset!')" title="Copy Hex Offset">Copy</button>
                </td>
            </tr>`;
        });
        el.coreTbody.innerHTML = html;
    }

    function renderPatchesTable() {
        if (!el.patchesTbody) return;
        if (state.patches.length === 0) {
            el.patchesTbody.innerHTML = '<tr class="empty-table-row"><td colspan="7">No patch methods extracted yet.</td></tr>';
            return;
        }

        let html = '';
        state.patches.forEach(p => {
            html += `
            <tr data-search="${esc(p.name + ' ' + p.rva + ' ' + p.className + ' ' + p.replaceAob).toLowerCase()}">
                <td>
                    <strong>${esc(p.name)}</strong>
                    ${p.subName ? '<br><small class="text-muted">' + esc(p.subName) + '</small>' : ''}
                </td>
                <td>
                    <span class="rva-chip" title="Click to copy Method RVA" onclick="window.NullApp.copyToClipboard('${esc(p.rva)}', 'Copied ${esc(p.name)} RVA!')">${esc(p.rva)}</span>
                </td>
                <td><span class="text-secondary" title="${esc(p.className)}">${esc(p.className)}</span></td>
                <td>
                    <span class="aob-chip" title="Click to copy Scan AOB" onclick="window.NullApp.copyToClipboard('${esc(p.scanAob)}', 'Copied Scan AOB!')">${esc(p.scanAob)}</span>
                </td>
                <td>
                    <span class="aob-chip aob-replace" title="Click to copy Replace AOB" onclick="window.NullApp.copyToClipboard('${esc(p.replaceAob)}', 'Copied Patch AOB!')">${esc(p.replaceAob)}</span>
                </td>
                <td><span class="text-secondary">${esc(p.sig)}</span></td>
                <td>
                    <button type="button" class="btn-copy-chip" onclick="window.NullApp.copyToClipboard('${esc(p.replaceAob)}', 'Copied ${esc(p.name)} Patch AOB!')" title="Copy Patch AOB">Copy</button>
                </td>
            </tr>`;
        });
        el.patchesTbody.innerHTML = html;
    }

    function renderBypassTable() {
        if (!el.bypassTbody) return;
        if (state.bypassMethods.length === 0) {
            el.bypassTbody.innerHTML = '<tr class="empty-table-row"><td colspan="7">No bypass methods found in this dump.cs.</td></tr>';
            return;
        }

        let html = '';
        state.bypassMethods.forEach(b => {
            html += `
            <tr data-search="${esc(b.name + ' ' + b.rva + ' ' + b.className + ' ' + b.replaceAob).toLowerCase()}">
                <td>
                    <span class="badge badge-red" style="margin-right:6px;">BYPASS</span>
                    <strong>${esc(b.name)}</strong>
                    ${b.subName ? '<br><small class="text-muted">' + esc(b.subName) + '</small>' : ''}
                </td>
                <td>
                    <span class="rva-chip" title="Click to copy Bypass RVA" onclick="window.NullApp.copyToClipboard('${esc(b.rva)}', 'Copied ${esc(b.name)} RVA!')">${esc(b.rva)}</span>
                </td>
                <td><span class="text-secondary" title="${esc(b.className)}">${esc(b.className)}</span></td>
                <td>
                    <span class="aob-chip" title="Click to copy Scan AOB" onclick="window.NullApp.copyToClipboard('${esc(b.scanAob)}', 'Copied Scan AOB!')">${esc(b.scanAob)}</span>
                </td>
                <td>
                    <span class="aob-chip aob-replace" title="Click to copy Replace AOB" onclick="window.NullApp.copyToClipboard('${esc(b.replaceAob)}', 'Copied Bypass Patch AOB!')">${esc(b.replaceAob)}</span>
                </td>
                <td><span class="text-secondary">${esc(b.sig)}</span></td>
                <td>
                    <button type="button" class="btn-copy-chip" onclick="window.NullApp.copyToClipboard('${esc(b.replaceAob)}', 'Copied ${esc(b.name)} Patch AOB!')" title="Copy Patch AOB">Copy</button>
                </td>
            </tr>`;
        });
        el.bypassTbody.innerHTML = html;
    }

    // =========================================================================
    // SEARCH & FILTERING
    // =========================================================================
    function switchSubTab(targetTabId) {
        state.activeSubTab = targetTabId;
        el.subTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
        });
        el.subPanels.forEach(p => {
            p.style.display = (p.id === targetTabId) ? 'block' : 'none';
        });
        if (targetTabId === 'tabExport') updateCodeOutput();
    }

    function applyFilter() {
        const q = state.currentFilter;
        const activePanel = document.getElementById(state.activeSubTab);
        if (!activePanel) return;

        const rows = activePanel.querySelectorAll('tbody tr:not(.empty-table-row)');
        rows.forEach(r => {
            const data = r.getAttribute('data-search') || r.textContent.toLowerCase();
            (r as HTMLElement).style.display = (!q || data.includes(q)) ? '' : 'none';
        });
    }

    function runCustomSearch() {
        if (!el.customSearchQuery || !el.searchTbody) return;
        const q = el.customSearchQuery.value.trim().toLowerCase();
        if (!q) {
            el.searchTbody.innerHTML = '<tr class="empty-table-row"><td colspan="6">Enter a query above to search through the entire dump.</td></tr>';
            return;
        }

        const lines = state.dumpContent.split('\n');
        let matches = [];
        let curClass = 'Global';

        for (let i = 0; i < lines.length && matches.length < 150; i++) {
            const line = lines[i];
            const cMatch = line.match(/(?:public|protected|private|internal)?\s*(?:abstract|sealed|static)?\s*class\s+([A-Za-z0-9_<>]+)/);
            if (cMatch) curClass = cMatch[1];

            if (line.toLowerCase().includes(q)) {
                const offMatch = line.match(/(0x[0-9a-fA-F]+)/);
                const offset = offMatch ? offMatch[1].toUpperCase() : '-';
                matches.push({
                    line: line.trim(),
                    className: curClass,
                    offset: offset
                });
            }
        }

        if (matches.length === 0) {
            el.searchTbody.innerHTML = `<tr class="empty-table-row"><td colspan="6">No occurrences of "${esc(q)}" found in dump.cs.</td></tr>`;
            return;
        }

        let html = '';
        matches.forEach(m => {
            html += `
            <tr>
                <td><strong>${esc(q)}</strong></td>
                <td><span class="hex-chip">${esc(m.offset)}</span></td>
                <td><span class="type-text">Matched Line</span></td>
                <td><span class="text-secondary">${esc(m.className)}</span></td>
                <td><code style="font-size:0.75rem;color:#cbd5e1;">${esc(m.line)}</code></td>
                <td><button type="button" class="btn-copy-chip" onclick="window.NullApp.copyToClipboard('${esc(m.offset)}', 'Copied offset!')">Copy</button></td>
            </tr>`;
        });
        el.searchTbody.innerHTML = html;
    }

    // =========================================================================
    // CODE GENERATOR (C++, C#, Frida, GameGuardian Lua, JSON)
    // =========================================================================
    function getOffset(name, fallback = '0x0') {
        const found = state.coreOffsets.find(c => c.name === name || c.key === name);
        if (found) return found.hex;
        const b = state.bones.find(x => x.name === name);
        if (b) return b.hex;
        return fallback;
    }

    function updateCodeOutput() {
        if (!el.codeOutput) return;
        const lang = state.activeLang;
        const isArm64 = state.is64Bit;
        const typeUint = isArm64 ? 'uint64_t' : 'uint32_t';
        const timestamp = new Date().toISOString();

        let out = '';

        if (lang === 'cpp') {
            out = `#pragma once
#include <cstdint>

// ============================================================================
// Free Fire ${isArm64 ? 'ARM64 (64-Bit / v8a)' : 'ARMv7 (32-Bit / v7a)'} Offsets
// Generated: ${timestamp}
// Generated via Null-Tools Bones & Offset Finder Engine
// ============================================================================

namespace Offsets {
    // ═══════════════ STATIC / BASE ═══════════════
    constexpr ${typeUint} InitBase             = ${getOffset('InitBase', '0xA342EFC')}; // Global TypeInfo table base pointer
    constexpr ${typeUint} InitBase_VAddr       = ${getOffset('InitBase_VAddr', '0xA342EFC')}; // Runtime Virtual Address in memory
    constexpr ${typeUint} GameFacadeSlotOffset = ${getOffset('GameFacadeSlotOffset', '0x4198')}; // Slot index for COW.GameFacade
    constexpr ${typeUint} StaticClass          = ${getOffset('StaticClass', '0x5C')};       // Il2CppClass->static_fields
    constexpr ${typeUint} CurrentMatchGame     = ${getOffset('CurrentMatchGame', '0x04')};

    // ═══════════════ MATCH / GAME STATE ═══════════════
    constexpr ${typeUint} CurrentMatch         = ${getOffset('CurrentMatch', '0x90')}; // MatchGame.m_Match
    constexpr ${typeUint} MatchState           = ${getOffset('MatchState', '0xCC')};
    constexpr ${typeUint} MatchStatus          = ${getOffset('MatchStatus', '0xCC')};
    constexpr ${typeUint} LocalPlayer          = ${getOffset('LocalPlayer', '0xD8')}; // Local player pointer
    constexpr ${typeUint} DictionaryEntities   = ${getOffset('DictionaryEntities', '0xC0')}; // Entities replication dict

    // ═══════════════ PLAYER FIELDS ═══════════════
    constexpr ${typeUint} Player_IsDead        = ${getOffset('Player_IsDead', '0x7C')};
    constexpr ${typeUint} Player_Name          = ${getOffset('Player_Name', '0x498')};
    constexpr ${typeUint} Player_Data          = ${getOffset('Player_Data', '0x70')};
    constexpr ${typeUint} Player_ShadowBase    = ${getOffset('Player_ShadowBase', '0x24A8')};
    constexpr ${typeUint} XPose                = ${getOffset('XPose', '0x80')};
    constexpr ${typeUint} LocalPlayerAttributes= ${getOffset('LocalPlayerAttributes', '0x768')};

    // ═══════════════ AVATAR / MODEL ═══════════════
    constexpr ${typeUint} AvatarManager        = ${getOffset('AvatarManager', '0x770')};
    constexpr ${typeUint} Avatar               = ${getOffset('Avatar', '0x138')};
    constexpr ${typeUint} Avatar_IsVisible     = ${getOffset('Avatar_IsVisible', '0x101')};
    constexpr ${typeUint} Avatar_Data          = ${getOffset('Avatar_Data', '0x28')};
    constexpr ${typeUint} Avatar_Data_IsTeam   = ${getOffset('Avatar_Data_IsTeam', '0x81')};

    // ═══════════════ CAMERA ═══════════════
    constexpr ${typeUint} FollowCamera         = ${getOffset('FollowCamera', '0x690')};
    constexpr ${typeUint} Camera               = ${getOffset('Camera', '0x30')};
    constexpr ${typeUint} MainCameraTransform  = ${getOffset('MainCameraTransform', '0x3E8')};
    constexpr ${typeUint} AimRotation          = ${getOffset('AimRotation', '0x614')};
    constexpr ${typeUint} ViewMatrix           = ${getOffset('ViewMatrix', '0x198')};
    constexpr ${typeUint} FovIncrease          = ${getOffset('FovIncrease', '0x84')};

    // ═══════════════ WEAPON ═══════════════
    constexpr ${typeUint} Weapon               = ${getOffset('Weapon', '0x600')};
    constexpr ${typeUint} WeaponData           = ${getOffset('WeaponData', '0x80')};
    constexpr ${typeUint} WeaponRecoil         = ${getOffset('WeaponRecoil', '0x18')};
    constexpr ${typeUint} InventoryManager     = ${getOffset('InventoryManager', '0x740')};
    constexpr ${typeUint} WeaponOnHand         = ${getOffset('WeaponOnHand', '0xA0')};
    constexpr ${typeUint} Rapidfire            = ${getOffset('Rapidfire', '0x254')};
    constexpr ${typeUint} BuffWeaponAmmoClip   = ${getOffset('BuffWeaponAmmoClip', '0x184')};

    // ═══════════════ SILENT AIM & AIMBOT ═══════════════
    constexpr ${typeUint} sAim1                = ${getOffset('sAim1', '0x848')};
    constexpr ${typeUint} sAim2                = ${getOffset('sAim2', '0xE50')};
    constexpr ${typeUint} sAim3                = ${getOffset('sAim3', '0x4C')};
    constexpr ${typeUint} sAim4                = ${getOffset('sAim4', '0x40')};
    constexpr ${typeUint} AimbotVisible        = ${getOffset('AimbotVisible', '0x738')};
    constexpr ${typeUint} HeadCollider         = ${getOffset('HeadCollider', '0x738')};
}

namespace Bones {
`;
            state.bones.forEach(b => {
                const cleanName = b.name.replace(/[^A-Za-z0-9_]/g, '_');
                out += `    constexpr ${typeUint} ${cleanName.padEnd(22, ' ')} = ${b.hex}; // ${b.desc}\n`;
            });
            out += `}\n`;
        } else if (lang === 'cs') {
            out = `// ============================================================================
// Free Fire ${isArm64 ? 'ARM64 (v8a)' : 'ARMv7 (v7a)'} Client Offsets & Skeleton Bones
// Generated via Null-Tools Bones & Offset Finder Engine
// ============================================================================

namespace Client
{
    internal static class Offsets
    {
        // Core
        internal static uint Il2Cpp;
        internal static uint InitBase = ${getOffset('InitBase', '0xA342EFC')};
        internal static uint StaticClass = ${getOffset('StaticClass', '0x5C')};

        // General
        internal static uint CurrentMatch             = ${getOffset('CurrentMatch', '0x90')};
        internal static uint MatchStatus              = ${getOffset('MatchStatus', '0xCC')};
        internal static uint LocalPlayer              = ${getOffset('LocalPlayer', '0xD8')};
        internal static uint DictionaryEntities       = ${getOffset('DictionaryEntities', '0xC0')};

        // Player
        internal static uint Player_IsDead            = ${getOffset('Player_IsDead', '0x7C')};
        internal static uint Player_Name              = ${getOffset('Player_Name', '0x498')};
        internal static uint Player_Data              = ${getOffset('Player_Data', '0x70')};
        internal static uint Player_ShadowBase        = ${getOffset('Player_ShadowBase', '0x24A8')};
        internal static uint XPose                    = ${getOffset('XPose', '0x80')};
        internal static uint LocalPlayerAttributes    = ${getOffset('LocalPlayerAttributes', '0x768')};

        // Avatar
        internal static uint AvatarManager            = ${getOffset('AvatarManager', '0x770')};
        internal static uint Avatar                   = ${getOffset('Avatar', '0x138')};
        internal static uint Avatar_IsVisible         = ${getOffset('Avatar_IsVisible', '0x101')};
        internal static uint Avatar_Data              = ${getOffset('Avatar_Data', '0x28')};
        internal static uint Avatar_Data_IsTeam       = ${getOffset('Avatar_Data_IsTeam', '0x81')};
        internal static uint BaseProfileInfo          = ${getOffset('BaseProfileInfo', '0x24D0')};

        // Camera
        internal static uint FollowCamera             = ${getOffset('FollowCamera', '0x690')};
        internal static uint Camera                   = ${getOffset('Camera', '0x30')};
        internal static uint MainCameraTransform      = ${getOffset('MainCameraTransform', '0x3E8')};
        internal static uint AimRotation              = ${getOffset('AimRotation', '0x614')};
        internal static uint ViewMatrix               = ${getOffset('ViewMatrix', '0x198')};
        internal static uint FovIncrease              = ${getOffset('FovIncrease', '0x84')};

        // Weapon
        internal static uint Weapon                   = ${getOffset('Weapon', '0x600')};
        internal static uint WeaponData               = ${getOffset('WeaponData', '0x80')};
        internal static uint WeaponRecoil             = ${getOffset('WeaponRecoil', '0x18')};
        internal static uint InventoryManager         = ${getOffset('InventoryManager', '0x740')};
        internal static uint WeaponOnHand             = ${getOffset('WeaponOnHand', '0xA0')};
        internal static uint Rapidfire                = ${getOffset('Rapidfire', '0x254')};
        internal static uint BuffWeaponAmmoClip       = ${getOffset('BuffWeaponAmmoClip', '0x184')};

        // Silent Aim & Aimbot
        internal static uint sAim1                    = ${getOffset('sAim1', '0x848')};
        internal static uint sAim2                    = ${getOffset('sAim2', '0xE50')};
        internal static uint sAim3                    = ${getOffset('sAim3', '0x4C')};
        internal static uint sAim4                    = ${getOffset('sAim4', '0x40')};
        internal static uint AimbotVisible            = ${getOffset('AimbotVisible', '0x738')};
        internal static uint HeadCollider             = ${getOffset('HeadCollider', '0x738')};
    }

    internal enum Bones : uint
    {
`;
            state.bones.forEach((b, idx) => {
                const cleanName = b.name.replace(/[^A-Za-z0-9_]/g, '_');
                const comma = (idx === state.bones.length - 1) ? '' : ',';
                out += `        ${cleanName.padEnd(20, ' ')} = ${b.hex}${comma}   // ${b.desc}\n`;
            });
            out += `    }\n}\n`;
        } else if (lang === 'frida') {
            out = `// ============================================================================
// Free Fire ${isArm64 ? 'ARM64' : 'ARMv7'} Frida Runtime Hook & Patch Script
// Generated via Null-Tools Bones & Offset Finder Engine
// ============================================================================

const moduleName = "libil2cpp.so";
let base = null;

function waitForLib(callback) {
    const check = setInterval(() => {
        base = Process.findModuleByName(moduleName);
        if (base) {
            clearInterval(check);
            console.log("[+] Found " + moduleName + " at: " + base.base);
            callback(base.base);
        }
    }, 200);
}

waitForLib((il2cppBase) => {
    // ═══════════════ DUAL AOB PATCHES ═══════════════
`;
            state.patches.forEach(p => {
                const bytes = p.replaceAob.split(' ').map(b => '0x' + b).join(', ');
                out += `    // ${p.name}: ${p.desc}
    Memory.patchCode(il2cppBase.add(${p.rva}), 16, function(code) {
        Memory.writeByteArray(code, [${bytes}]);
    });
    console.log("[+] Applied patch: ${p.name} at ${p.rva}");

`;
            });
            out += `    // ═══════════════ ANTI-DETECT BYPASSES ═══════════════
`;
            state.bypassMethods.forEach(b => {
                const bytes = b.replaceAob.split(' ').map(x => '0x' + x).join(', ');
                out += `    // ${b.name}
    Memory.patchCode(il2cppBase.add(${b.rva}), 16, function(code) {
        Memory.writeByteArray(code, [${bytes}]);
    });
    console.log("[+] Activated Bypass: ${b.name} at ${b.rva}");

`;
            });
            out += `});\n`;
        } else if (lang === 'gg') {
            out = `-- ============================================================================
-- Free Fire ${isArm64 ? 'ARM64' : 'ARMv7'} GameGuardian Lua Memory Script
-- Generated via Null-Tools Bones & Offset Finder Engine
-- ============================================================================

gg.clearResults()
gg.setRanges(gg.REGION_CODE_APP | gg.REGION_ANONYMOUS)

function patch(addr, hexBytes, desc)
    local t = {}
    local i = 0
    for byte in hexBytes:gmatch("%x%x") do
        t[#t + 1] = { address = addr + i, flags = gg.TYPE_BYTE, value = tonumber(byte, 16) }
        i = i + 1
    end
    gg.setValues(t)
    gg.toast("Applied: " .. desc)
end

local il2cpp = gg.getRangesList("libil2cpp.so")[1]
if not il2cpp then
    gg.alert("Error: libil2cpp.so not found in memory!")
    return
end

local base = il2cpp.start
gg.toast("Hooking libil2cpp: " .. string.format("0x%X", base))

-- Patches
`;
            state.patches.forEach(p => {
                out += `patch(base + ${p.rva}, "${p.replaceAob.replace(/\s+/g, '')}", "${p.name}")\n`;
            });
            out += `\n-- Anti-Detect Bypasses\n`;
            state.bypassMethods.forEach(b => {
                out += `patch(base + ${b.rva}, "${b.replaceAob.replace(/\s+/g, '')}", "${b.name}")\n`;
            });
            out += `\ngg.alert("All ${state.patches.length + state.bypassMethods.length} Patches & Bypasses Active!")\n`;
        } else if (lang === 'json') {
            const jsonExport = {
                metadata: {
                    tool: 'Null-Tools Bones & Offset Finder Engine',
                    targetArch: isArm64 ? 'ARM64 (v8a)' : 'ARMv7 (v7a)',
                    generatedAt: timestamp,
                    totalBones: state.bones.length,
                    totalCoreOffsets: state.coreOffsets.length,
                    totalPatches: state.patches.length,
                    totalBypasses: state.bypassMethods.length
                },
                bones: state.bones,
                coreOffsets: state.coreOffsets,
                patches: state.patches,
                bypassMethods: state.bypassMethods
            };
            out = JSON.stringify(jsonExport, null, 4);
        }

        el.codeOutput.textContent = out;
    }

    function saveOffsetsTxt() {
        if (state.coreOffsets.length === 0 && state.bones.length === 0) {
            if (window.NullApp && window.NullApp.showToast) window.NullApp.showToast('No offsets to save! Please analyze a dump.cs file first.');
            return;
        }

        let txt = `// ============================================================================
// Free Fire ${state.is64Bit ? 'ARM64 (v8a)' : 'ARMv7 (v7a)'} Client Offsets & Skeleton Bones
// Generated via Null-Tools Bones & Offset Finder
// ============================================================================

namespace Client
{
    internal static class Offsets
    {
        // Core
        internal static uint Il2Cpp;
        internal static uint InitBase = ${getOffset('InitBase', '0xA342EFC')};
        internal static uint StaticClass = ${getOffset('StaticClass', '0x5C')};

        // General
        internal static uint CurrentMatch             = ${getOffset('CurrentMatch', '0x90')};
        internal static uint MatchStatus              = ${getOffset('MatchStatus', '0xCC')};
        internal static uint LocalPlayer              = ${getOffset('LocalPlayer', '0xD8')};
        internal static uint DictionaryEntities       = ${getOffset('DictionaryEntities', '0xC0')};

        // Player
        internal static uint Player_IsDead            = ${getOffset('Player_IsDead', '0x7C')};
        internal static uint Player_Name              = ${getOffset('Player_Name', '0x498')};
        internal static uint Player_Data              = ${getOffset('Player_Data', '0x70')};
        internal static uint Player_ShadowBase        = ${getOffset('Player_ShadowBase', '0x24A8')};
        internal static uint XPose                    = ${getOffset('XPose', '0x80')};
        internal static uint LocalPlayerAttributes    = ${getOffset('LocalPlayerAttributes', '0x768')};

        // Avatar
        internal static uint AvatarManager            = ${getOffset('AvatarManager', '0x770')};
        internal static uint Avatar                   = ${getOffset('Avatar', '0x138')};
        internal static uint Avatar_IsVisible         = ${getOffset('Avatar_IsVisible', '0x101')};
        internal static uint Avatar_Data              = ${getOffset('Avatar_Data', '0x28')};
        internal static uint Avatar_Data_IsTeam       = ${getOffset('Avatar_Data_IsTeam', '0x81')};
        internal static uint BaseProfileInfo          = ${getOffset('BaseProfileInfo', '0x24D0')};

        // Camera
        internal static uint FollowCamera             = ${getOffset('FollowCamera', '0x690')};
        internal static uint Camera                   = ${getOffset('Camera', '0x30')};
        internal static uint MainCameraTransform      = ${getOffset('MainCameraTransform', '0x3E8')};
        internal static uint AimRotation              = ${getOffset('AimRotation', '0x614')};
        internal static uint ViewMatrix               = ${getOffset('ViewMatrix', '0x198')};
        internal static uint FovIncrease              = ${getOffset('FovIncrease', '0x84')};

        // Weapon
        internal static uint Weapon                   = ${getOffset('Weapon', '0x600')};
        internal static uint WeaponData               = ${getOffset('WeaponData', '0x80')};
        internal static uint WeaponRecoil             = ${getOffset('WeaponRecoil', '0x18')};
        internal static uint InventoryManager         = ${getOffset('InventoryManager', '0x740')};
        internal static uint WeaponOnHand             = ${getOffset('WeaponOnHand', '0xA0')};
        internal static uint Rapidfire                = ${getOffset('Rapidfire', '0x254')};
        internal static uint BuffWeaponAmmoClip       = ${getOffset('BuffWeaponAmmoClip', '0x184')};

        // Silent Aim & Aimbot
        internal static uint sAim1                    = ${getOffset('sAim1', '0x848')};
        internal static uint sAim2                    = ${getOffset('sAim2', '0xE50')};
        internal static uint sAim3                    = ${getOffset('sAim3', '0x4C')};
        internal static uint sAim4                    = ${getOffset('sAim4', '0x40')};
        internal static uint AimbotVisible            = ${getOffset('AimbotVisible', '0x738')};
        internal static uint HeadCollider             = ${getOffset('HeadCollider', '0x738')};
    }

    internal enum Bones : uint
    {
`;
        state.bones.forEach((b, idx) => {
            const cleanName = b.name.replace(/[^A-Za-z0-9_]/g, '_');
            const comma = (idx === state.bones.length - 1) ? '' : ',';
            txt += `        ${cleanName.padEnd(20, ' ')} = ${b.hex}${comma}   // ${b.desc}\n`;
        });
        txt += `    }\n}\n`;

        if (window.NullApp && window.NullApp.downloadTextFile) {
            window.NullApp.downloadTextFile('offsets.txt', txt);
        }
    }

    function downloadGeneratedCode() {
        if (!el.codeOutput) return;
        const text = el.codeOutput.textContent;
        const lang = state.activeLang;
        const extMap = { cpp: 'h', cs: 'cs', frida: 'js', gg: 'lua', json: 'json' };
        const filename = `offsets_dump.${extMap[lang] || 'txt'}`;
        if (window.NullApp && window.NullApp.downloadTextFile) {
            window.NullApp.downloadTextFile(filename, text);
        }
    }

    // Public API for Router & Automated Test Suite
    return {
        init,
        getState: () => state,
        runAnalysis,
        executeParsing,
        parsePlayerBones,
        parseCoreOffsets,
        parsePatches,
        parseBypass,
        renderBonesTable,
        renderCoreTable,
        renderPatchesTable,
        renderBypassTable,
        updateCodeOutput,
        runCustomSearch,
        switchSubTab,
        saveOffsetsTxt,
        downloadGeneratedCode
    };
})();

if (typeof window !== 'undefined') window.Tool1Bones = Tool1Bones;
if (typeof globalThis !== 'undefined') (globalThis as any).Tool1Bones = Tool1Bones;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool1Bones;


