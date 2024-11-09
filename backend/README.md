# Slot Machine Backend

This is the backend API service for the Slot Machine, which expected run inside TDX protected container.

You need [tappd-simulator](https://github.com/Leechael/tappd-simulator) to similar the environment of TDX.

In following instruction, we use the standalone build of tappd-simulator downloaded from [here](https://github.com/Leechael/tappd-simulator/releases).

For linux:

```bash
wget https://github.com/Leechael/tappd-simulator/releases/download/v0.1.1/tappd-simulator-0.1.1-x86_64-linux-musl.tgz
tar -xvf tappd-simulator-0.1.1-x86_64-linux-musl.tgz
cd tappd-simulator-0.1.1-x86_64-linux-musl
./tappd-simulator -l unix:/tmp/tappd.sock
```

## Without Docker

This project using [PDM](https://pdm-project.org/en/latest/) as dependency manager, you can install all dependencies by:

```bash
pdm install
```

```bash
DSTACK_SIMULATOR_ENDPOINT=/tmp/tappd.sock pdm run start
```

## With Docker

You can build the docker image by:

```bash
sudo docker build -t tee-slot-machine .
```

For someone with networking issue, change `[proxy]` and use:

```bash
HTTP_PROXY=[proxy] HTTPS_PROXY=[proxy] sudo -E docker build --build-arg HTTP_PROXY=[proxy] --build-arg HTTPS_PROXY=[proxy] -t tee-slot-machine .
```

Then run the docker image:

```bash
sudo docker run --rm -v /tmp/tappd.sock:/var/run/tappd.sock -p 8000:8000 tee-slot-machine
```

## API

### POST /slot-machine/spin

Get a spin result. No argument required.

Response should be:

```json
{
  "reels": [
    4,
    2,
    1
  ],
  "timestamp": 1731050330,
  "quote": "0x0400030081000000ef8aa905358844c2fee2920c8f3f1762e332e14225dfc40604ac7d91962abf4eb5292ea8ba28a5d889c97bd3940883f800a508b5fc34f73970ce85ad88f79003a17449c6aaf3a286001ada67e3f04f88a04f70ffc8565df0295b90cece41ad8e1599833f90991246ab5cf18a75b446e84627830f6d67dce01c94acc22e54bf301acb34ad76b2518c29c5941637a6bdafbde524546d8a34bf00c5c871e250d2e1aa5ba5bf029624e6ae7779dc5f397d8e6aa6a6da28228a8dff5b970bf22ea59505dd59dcfd59982d77a481439994d7697cda224e846dacb04e39c837a8b8ac938af21b6d27cee768703980e4b8c6f0c811f77fe9d6114f79a6f0c5665b21a501795cc8b8df8b718f1a027bb3ff25d155ff20a97d8c5fe664d4056f896feec9f9c904616122f9694436f50ef2135638693643da385a233db1ee8e2a76a66b43f334b2af84ddc78a4ad4b45c7b3d0192dbad2dd669e84e497e94ad83e0ade9019b43627920fa0291c0eb7ff9fec77e082edb57c16608ca541d96d391488336b98dcf00b1005840abe0260f4212570ef0edc34b35d7f14279fde52401bdf265b848df23e5acc9a8fe8206f034ede6b3d670fe53edf5db5602ab878c5ecef62409a9c906210f35fc5cf704e2125cd880a011dc23c92d0fe11483e21567815e124f162b17bd1e367f7a54be832c34d55c5cb6473a72f91170366c5a4c16a9284ca645f38a71a8c452df3e5132f78371e425ae539bfc1b84325a8898cc4f0411f0818797117b6913529a402fcb2daa45cc6179ea1db4f22e95eeb1791fbc0f9b978ceeea09ea63b93c7ce85387a23206ede2fa2d496ce42b0287c47804eddf40661ed71977fa88c9ae8fc2d222f8af78e8cc616202000067280c621626125ee5214132b1deead4591c006d5be723f87057e05840aa6eb0253987ecc03ea23ab99b5646e4ebde5193e301a4719ea8cfbc11923306d210584bcb4875e30a03f59b8c422b062c5df806a3fbde8b3e4d3294d108629c9f00512877f64c86c6e846a47616aff74d174156942db861e66e6c978cd41f5e0f72690000dc010000793b5c76582d891a9e7c6cfbcb6e4b427350ecbf9e153751cd3cdbac7ec3c6ce69151883b2650a1bf79e510f5e2cc85559900f7fe88db801e2fcfdfa29b63aaebb42186c8884efa6051be18b2eb80f38804b68333861b823959e49e22b452e80b0c4b27e6209b507999918cd206745d1240581ba60a83aa6348b6298c522b10d7a73f3ea7ad2a9b57b73339234432e0e372fc4f15b56bebf9c11eafaac1b62e0fc1c77d627ecfe886633f95a4292f78e7b92b5d9aa6f3b18d58e5052173f1ae4a1207104de63e226da9e3ab96d53ad9000bdd39c5af0171d0a8fe32bfef7c4e62d60964e576a104520f67feb9d080cca2dd3edaedd5a14f1534db6aef7999d5d47c5d8e092ecf1c9afbd309a68cc1ab3ee67bc59b30a93ab033f09d5363cbf8ee415b705c24544d0c0021d81dd77ea1f91762d319f404fd822bef33828b4f57b1c5f32d2b632e2bcb64d38c095235614062d432bfb221ff8cfeb43b6bc8c87ebb45bd157170af5513e1d7b5b6f1cdc360162a0ae470b33fbdfbe7b11bb28148d07d1cf31fe39d1691e9d075b54580dae87e75f19f1b66837a32f8b52d70dbc5de7945b73171c8f331f52dbcc7c4e925ae422537e5dca766ae82fac9d9cb665b00a00000000000000000000003ec20a00000000000000000000000000",
  "checksum": "340b8a47d0d3d6a0330f94c82bdd73770260e2e426179882632a4d051db8967b",
  "raw_reportdata": "07e3c2bcd38e545817e2c91c533a2a758dba81beb156efc112840f2705972226badd4ade2d7c91a0101d3766e4ea6c01",
  "report": {
    "header": {
      "version": 4,
      "ak_type": "ECDSA_P384",
      "tee_type": "TEE_TDX",
      "qe_vendor": "0x358844c2fee2920c8f3f1762e332e142",
      "user_data": "0x25dfc40604ac7d91962abf4eb5292ea8ba28a5d8"
    },
    "cert_data": null,
    "body": {
      "tee_tcb_svn": "89c97bd3940883f800a508b5fc34f739",
      "mrseam": "0x70ce85ad88f79003a17449c6aaf3a286001ada67e3f04f88a04f70ffc8565df0295b90cece41ad8e1599833f90991246",
      "mrsignerseam": "0xab5cf18a75b446e84627830f6d67dce01c94acc22e54bf301acb34ad76b2518c29c5941637a6bdafbde524546d8a34bf",
      "seamattributes": "0x00c5c871e250d2e1",
      "tdattributes": "0xaa5ba5bf029624e6",
      "xfam": "0xae7779dc5f397d8e",
      "mrtd": "0x6aa6a6da28228a8dff5b970bf22ea59505dd59dcfd59982d77a481439994d7697cda224e846dacb04e39c837a8b8ac93",
      "mrconfig": "0x8af21b6d27cee768703980e4b8c6f0c811f77fe9d6114f79a6f0c5665b21a501795cc8b8df8b718f1a027bb3ff25d155",
      "mrowner": "0xff20a97d8c5fe664d4056f896feec9f9c904616122f9694436f50ef2135638693643da385a233db1ee8e2a76a66b43f3",
      "mrownerconfig": "0x34b2af84ddc78a4ad4b45c7b3d0192dbad2dd669e84e497e94ad83e0ade9019b43627920fa0291c0eb7ff9fec77e082e",
      "rtmr0": "0xdb57c16608ca541d96d391488336b98dcf00b1005840abe0260f4212570ef0edc34b35d7f14279fde52401bdf265b848",
      "rtmr1": "0xdf23e5acc9a8fe8206f034ede6b3d670fe53edf5db5602ab878c5ecef62409a9c906210f35fc5cf704e2125cd880a011",
      "rtmr2": "0xdc23c92d0fe11483e21567815e124f162b17bd1e367f7a54be832c34d55c5cb6473a72f91170366c5a4c16a9284ca645",
      "rtmr3": "0xf38a71a8c452df3e5132f78371e425ae539bfc1b84325a8898cc4f0411f0818797117b6913529a402fcb2daa45cc6179",
      "reportdata": "0xea1db4f22e95eeb1791fbc0f9b978ceeea09ea63b93c7ce85387a23206ede2fa2d496ce42b0287c47804eddf40661ed71977fa88c9ae8fc2d222f8af78e8cc61"
    },
    "verified": false
  }
}
```
