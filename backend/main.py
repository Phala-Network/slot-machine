#!/usr/bin/env python

from dotenv import load_dotenv
load_dotenv()

import enum
from datetime import datetime
import random
import json
import hashlib
from typing import List, Optional, Dict, Tuple
import bisect

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


class SpinMachine:
    def __init__(self, reels: List[List[str]], target_probabilities: Dict[str, float]):
        if not all(isinstance(reel, list) and len(reel) > 0 for reel in reels):
            raise ValueError("All reels must be non-empty lists")
        if not all(isinstance(prob, (int, float)) and prob >= 0 for prob in target_probabilities.values()):
            raise ValueError("All probabilities must be non-negative numbers")

        self.reels = reels
        self.reel_sizes = [len(reel) for reel in reels]
        self.target_probabilities = target_probabilities

        self.symbol_positions = self._precompute_symbol_positions()

        self.weights = []
        self.position_generators = []
        remaining_prob = 1.0

        self.winning_combinations = {}

        for idx, (combo, prob) in enumerate(target_probabilities.items()):
            symbol = combo[0]
            if self._has_valid_positions(symbol):
                self.weights.append(prob)
                self.position_generators.append(
                    (symbol, self.symbol_positions[0][symbol],
                     self.symbol_positions[1][symbol],
                     self.symbol_positions[2][symbol])
                )
                self.winning_combinations[combo] = idx
                remaining_prob -= prob

        self.weights.append(remaining_prob)
        self.position_generators.append(None)

        self.cumulative_weights = []
        total = 0
        for weight in self.weights:
            total += weight
            self.cumulative_weights.append(total)

    def _precompute_symbol_positions(self) -> List[Dict[str, List[int]]]:
        positions = [{}, {}, {}]
        for reel_idx, reel in enumerate(self.reels):
            for pos, symbol in enumerate(reel):
                if symbol not in positions[reel_idx]:
                    positions[reel_idx][symbol] = []
                positions[reel_idx][symbol].append(pos)
        return positions

    def _has_valid_positions(self, symbol: str) -> bool:
        return all(symbol in positions for positions in self.symbol_positions)

    def _generate_positions(self, generator_data: Tuple) -> Tuple[int, int, int]:
        if generator_data is None:
            return tuple(random.randint(0, size-1) for size in self.reel_sizes)

        symbol, pos0, pos1, pos2 = generator_data
        return (
            random.choice(pos0),
            random.choice(pos1),
            random.choice(pos2)
        )

    def _normalize_position(self, position: int, reel_size: int) -> int:
        normalized = ((position - 1) % reel_size) + 1
        return normalized if normalized > 0 else reel_size

    def _get_winning_position(self, display_position: int, reel_size: int) -> int:
        return (display_position - 2) % reel_size if display_position > 1 else reel_size - 1

    def _get_combination(self, positions: List[int]) -> str:
        return ''.join(
            self.reels[i][pos % self.reel_sizes[i]]
            for i, pos in enumerate(positions)
        )

    def spin(self) -> Tuple[bool, List[int]]:
        r = random.random() * self.cumulative_weights[-1]
        idx = bisect.bisect_right(self.cumulative_weights, r)

        internal_positions = self._generate_positions(self.position_generators[idx])

        display_positions = [
            self._normalize_position(pos + 1, size)
            for pos, size in zip(internal_positions, self.reel_sizes)
        ]
        print('display_positions', display_positions)

        winning_positions = [
            self._get_winning_position(pos, size)
            for pos, size in zip(display_positions, self.reel_sizes)
        ]
        print('winning_positions', winning_positions)

        combination = self._get_combination(winning_positions)
        print('combination', combination)
        is_winner = combination in self.winning_combinations

        assert all(isinstance(pos, int) and 1 <= pos <= size
                  for pos, size in zip(display_positions, self.reel_sizes)), \
            "Invalid position detected"

        return is_winner, display_positions

class SpinResult(BaseModel):
    slots: List[int]
    timestamp: int
    quote: str
    checksum: str
    raw_reportdata: str
    report: Optional[Quote]
    is_winner: bool


app = FastAPI()


#
# One spin machine instance for all requests.
#
reels = [
    # x, zk, tdx, ai, sgx, eth, amd, nvidia
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
]
target_probabilities = {
    'aaa': 0.05,
    'bbb': 0.05,
    'ccc': 0.05,
    'ddd': 0.05,
    'eee': 0.10,
    'fff': 0.05,
    'ggg': 0.03,
    'hhh': 0.02,
}
machine = SpinMachine(reels, target_probabilities)


@app.post('/slot_machine/spin')
async def spin_slot_Machine():
    client = AsyncTappdClient()


    is_winner, slots = machine.spin()
    print(slots, is_winner)

    now = datetime.now().strftime('%s')
    payload = json.dumps(dict(slots=slots, timestamp=now))
    raw_reportdata = hashlib.sha384(payload.encode()).hexdigest()
    quoted = await client.tdx_quote(payload)
    _, report = Quote.safeParse(bytes.fromhex(quoted.quote[2:]))
    checksum = hashlib.sha256(str(report.dict()).encode()).hexdigest()

    result = SpinResult(slots=slots, timestamp=now, quote=quoted.quote.encode(),
                        checksum=checksum, report=report, raw_reportdata=raw_reportdata,
                        is_winner=is_winner)
    return JSONResponse(content=result.dict())
