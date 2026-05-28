# Model Weights Directory

Place your Kaggle-extracted model weight folders here:

```
models/
├── best_efficientnet_s4/
│   ├── .data/
│   ├── data/
│   ├── .format_version
│   ├── .storage_alignment
│   ├── byteorder
│   ├── data.pkl
│   └── version
└── best_efficientnet_se_s4/
    ├── .data/
    ├── data/
    ├── .format_version
    ├── .storage_alignment
    ├── byteorder
    ├── data.pkl
    └── version
```

These folders are volume-mounted into the container at `/app/models/` via docker-compose.
