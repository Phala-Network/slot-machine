#!/usr/bin/env python

from dotenv import load_dotenv
load_dotenv()

import enum
from datetime import datetime
from random import randrange
import json
import hashlib

from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel, field_serializer
from evidence_api.tdx.quote import TdxQuote, AttestationKeyType, TeeType, TdxQuoteTeeTcbSvn, TdxQuoteTeeTcbSvn, TdxQuoteTeeTcbSvn, TdxQuoteTeeTcbSvn

from dstack_sdk import AsyncTappdClient


"""
Wrap TdxQuote into Human-friendly & serializable object for Web
"""

class QuoteHeader(BaseModel):
    version: int
    ak_type: AttestationKeyType
    tee_type: TeeType
    qe_vendor: bytes
    user_data: bytes

    @field_serializer('ak_type', 'tee_type')
    def serialize_enum(self, value):
        return value.name

    @field_serializer('qe_vendor', 'user_data')
    def serialize_bytes(self, value):
        return '0x' + value.hex()


class QuoteBody(BaseModel):
    tee_tcb_svn: str
    mrseam: bytes
    mrsignerseam: bytes
    seamattributes: bytes
    tdattributes: bytes
    xfam: bytes
    mrtd: bytes
    mrconfig: bytes
    mrowner: bytes
    mrownerconfig: bytes
    rtmr0: bytes
    rtmr1: bytes
    rtmr2: bytes
    rtmr3: bytes
    reportdata: bytes

    @field_serializer('mrseam', 'mrsignerseam', 'seamattributes', 'tdattributes', 'xfam',
                      'mrtd', 'mrconfig', 'mrowner', 'mrownerconfig', 'rtmr0', 'rtmr1',
                      'rtmr2', 'rtmr3', 'reportdata')
    def serialize_bytes(self, value):
        return '0x' + value.hex()


class Quote(BaseModel):
    header: QuoteHeader
    cert_data: Optional[str]
    body: QuoteBody
    verified: Optional[bool] = False

    @staticmethod
    def safeParse(raw):
        try:
            tdxQuote = TdxQuote(raw)
            header = QuoteHeader(
                version=tdxQuote.header.ver,
                ak_type=tdxQuote.header.ak_type,
                tee_type=tdxQuote.header.tee_type,
                qe_vendor=tdxQuote.header.qe_vendor,
                user_data=tdxQuote.header.user_data,
            )
            try:
                cert_data = tdxQuote.sig.qe_cert.cert_data.qe_cert_data.cert_data
                if cert_data[-1] == 0:
                    cert_data = cert_data[:-1]
                cert_data = cert_data.decode('utf8')
            except:
                cert_data = None
            body = QuoteBody(
                tee_tcb_svn=tdxQuote.body.tee_tcb_svn.data.hex(),
                mrseam=tdxQuote.body.mrseam,
                mrsignerseam=tdxQuote.body.mrsignerseam,
                seamattributes=tdxQuote.body.seamattributes,
                tdattributes=tdxQuote.body.tdattributes,
                xfam=tdxQuote.body.xfam,
                mrtd=tdxQuote.body.mrtd,
                mrconfig=tdxQuote.body.mrconfig,
                mrowner=tdxQuote.body.mrowner,
                mrownerconfig=tdxQuote.body.mrownerconfig,
                rtmr0=tdxQuote.body.rtmr0,
                rtmr1=tdxQuote.body.rtmr1,
                rtmr2=tdxQuote.body.rtmr2,
                rtmr3=tdxQuote.body.rtmr3,
                reportdata=tdxQuote.body.reportdata
            )
            rec = Quote(
                header=header,
                cert_data=cert_data,
                body=body
            )
            return (True, rec)
        except Exception as err:
            print(err)
            return (False, None)


class SpinResult(BaseModel):
    reels: List[int]
    timestamp: int 
    quote: str
    checksum: str
    raw_reportdata: str
    report: Optional[Quote]


app = FastAPI()


@app.post('/slot_machine/spin')
async def spin_slot_Machine():
    client = AsyncTappdClient('/Users/leechael/workshop/phala/tappd-simulator/tappd.sock')

    reels = [randrange(0, 15) for _ in range(3)]
    now = datetime.now().strftime('%s')
    payload = json.dumps(dict(reels=reels, timestamp=now))
    print(payload)
    raw_reportdata = hashlib.sha384(payload.encode()).hexdigest()
    quoted = await client.tdx_quote(payload)
    print(quoted.quote)
    _, report = Quote.safeParse(bytes.fromhex(quoted.quote[2:]))
    checksum = hashlib.sha256(str(report.dict()).encode()).hexdigest()
    print(checksum)
    print(report)

    result = SpinResult(reels=reels, timestamp=now, quote=quoted.quote.encode(),
                        checksum=checksum, report=report, raw_reportdata=raw_reportdata)
    return JSONResponse(content=result.dict())
